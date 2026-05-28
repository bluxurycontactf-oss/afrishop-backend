import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { PrismaService } from '../../config/prisma.service';
import slugify from 'slugify';

export interface AliexpressProduct {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  images: string[];
  variants: AliexpressVariant[];
  stock: number;
  aliexpressId: string;
  aliexpressUrl: string;
  rating: number;
  soldCount: number;
}

export interface AliexpressVariant {
  name: string;
  price: number;
  stock: number;
  image?: string;
  attributes: Record<string, string>;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(private prisma: PrismaService) {}

  // ── Scrape un produit AliExpress depuis son URL ─────────────
  async scrapeProduct(url: string): Promise<AliexpressProduct> {
    if (!url.includes('aliexpress.com')) {
      throw new BadRequestException('URL AliExpress invalide');
    }

    this.logger.log(`🔍 Scraping : ${url}`);

    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--lang=en-US',
      ],
    });

    try {
      const page = await browser.newPage();

      // User-agent réaliste
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Extraire les données via JavaScript dans la page
      const data = await page.evaluate(() => {
        const getPrice = (selector: string): number => {
          const el = document.querySelector(selector);
          if (!el) return 0;
          const text = el.textContent?.replace(/[^0-9.]/g, '') || '0';
          return parseFloat(text) || 0;
        };

        const getText = (selector: string): string =>
          document.querySelector(selector)?.textContent?.trim() || '';

        // Nom du produit
        const name =
          getText('h1[data-pl="product-title"]') ||
          getText('.product-title-text') ||
          getText('h1') ||
          'Produit AliExpress';

        // Prix
        const priceText =
          document.querySelector('.product-price-current')?.textContent ||
          document.querySelector('[class*="price--current"]')?.textContent ||
          '0';
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

        // Images
        const images: string[] = [];
        document.querySelectorAll('.slider-image img, .images-view-item img').forEach((img: HTMLImageElement) => {
          if (img.src && !images.includes(img.src)) {
            images.push(img.src.replace(/_\d+x\d+\.jpg/, '_640x640.jpg'));
          }
        });

        // Description
        const description = getText('.product-description') || getText('[class*="description"]') || '';

        // ID produit
        const aliexpressId = window.location.pathname.match(/\/(\d+)\.html/)?.[1] || '';

        return { name, price, images: images.slice(0, 10), description, aliexpressId };
      });

      // Chercher les données JSON dans les scripts (méthode plus fiable)
      const scriptData = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          const content = script.textContent || '';
          if (content.includes('window.runParams') || content.includes('skuPropertyList')) {
            return content;
          }
        }
        return '';
      });

      // Parser les variantes depuis les données JSON
      const variants = this.parseVariantsFromScript(scriptData);

      await browser.close();

      return {
        name: data.name,
        description: data.description,
        price: data.price || 0,
        originalPrice: data.price || 0,
        images: data.images,
        variants,
        stock: 100, // Stock par défaut
        aliexpressId: data.aliexpressId,
        aliexpressUrl: url,
        rating: 0,
        soldCount: 0,
      };
    } catch (error) {
      await browser.close();
      this.logger.error(`Erreur scraping : ${error.message}`);
      throw new BadRequestException(`Impossible d'importer ce produit : ${error.message}`);
    }
  }

  private parseVariantsFromScript(scriptContent: string): AliexpressVariant[] {
    try {
      const match = scriptContent.match(/skuPropertyList\s*:\s*(\[.+?\])/s);
      if (!match) return [];
      // Parsing simplifié — les vraies données sont dans le JSON complet
      return [];
    } catch {
      return [];
    }
  }

  // ── Importer et sauvegarder le produit en base ──────────────
  async importProduct(url: string, categoryId?: string, markup: number = 30) {
    const scraped = await this.scrapeProduct(url);

    // Calcul prix de vente avec marge
    const salePrice = scraped.price * (1 + markup / 100);

    // Générer un slug unique
    let slug = slugify(scraped.name, { lower: true, strict: true });
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    // Créer le produit
    const product = await this.prisma.product.create({
      data: {
        name: scraped.name,
        slug,
        description: scraped.description,
        price: salePrice,
        costPrice: scraped.price,
        comparePrice: salePrice * 1.2,
        currency: 'XOF',
        stock: scraped.stock,
        aliexpressUrl: url,
        aliexpressId: scraped.aliexpressId,
        lastSyncAt: new Date(),
        categoryId: categoryId || null,
        images: {
          create: scraped.images.map((url, index) => ({
            url,
            sortOrder: index,
          })),
        },
        variants: scraped.variants.length > 0 ? {
          create: scraped.variants.map((v) => ({
            name: v.name,
            price: v.price * (1 + markup / 100),
            stock: v.stock,
            image: v.image,
            attributes: v.attributes,
          })),
        } : undefined,
      },
      include: { images: true, variants: true },
    });

    this.logger.log(`✅ Produit importé : ${product.name} (ID: ${product.id})`);
    return product;
  }

  // ── Synchronisation prix ────────────────────────────────────
  async syncProductPrice(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product?.aliexpressUrl) return;

    try {
      const scraped = await this.scrapeProduct(product.aliexpressUrl);
      const markup = product.costPrice
        ? ((Number(product.price) - Number(product.costPrice)) / Number(product.costPrice)) * 100
        : 30;

      await this.prisma.product.update({
        where: { id: productId },
        data: {
          costPrice: scraped.price,
          price: scraped.price * (1 + markup / 100),
          stock: scraped.stock,
          lastSyncAt: new Date(),
        },
      });
      this.logger.log(`🔄 Prix synchronisé : ${product.name}`);
    } catch (error) {
      this.logger.error(`Erreur sync prix ${productId}: ${error.message}`);
    }
  }
}
