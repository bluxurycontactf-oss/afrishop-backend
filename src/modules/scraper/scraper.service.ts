import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
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

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(private prisma: PrismaService) {}

  async scrapeProduct(url: string): Promise<AliexpressProduct> {
    if (!url.includes('aliexpress.com')) {
      throw new BadRequestException('URL AliExpress invalide');
    }

    this.logger.log(`🔍 Scraping : ${url}`);

    // Extraire l'ID produit depuis l'URL
    const aliexpressId = url.match(/\/(\d{10,})\./)?.[1] || url.match(/item\/(\d+)/)?.[1] || '';

    let html = '';
    try {
      const response = await axios.get(url, {
        headers: HEADERS,
        timeout: 20000,
        maxRedirects: 5,
      });
      html = response.data;
    } catch (error) {
      this.logger.warn(`Fetch échoué, tentative avec URL mobile...`);
      // Essayer l'URL mobile
      const mobileUrl = url.replace('www.aliexpress.com', 'm.aliexpress.com');
      try {
        const response = await axios.get(mobileUrl, { headers: HEADERS, timeout: 20000 });
        html = response.data;
      } catch {
        throw new BadRequestException('Impossible de récupérer la page AliExpress');
      }
    }

    const $ = cheerio.load(html);

    // ── Extraire le JSON embarqué dans la page ──────────────
    let runParams: any = null;
    $('script').each((_, el) => {
      const content = $(el).html() || '';
      if (content.includes('window.runParams') && !runParams) {
        // Extraire l'objet JSON
        const match = content.match(/window\.runParams\s*=\s*(\{[\s\S]+?\});\s*(?:window|var|let|const|$)/);
        if (match) {
          try { runParams = JSON.parse(match[1]); } catch { /* continuer */ }
        }
      }
      // Essayer aussi le format data: {...}
      if (!runParams && content.includes('"descriptionModule"')) {
        const match = content.match(/data\s*:\s*(\{[\s\S]+?"descriptionModule"[\s\S]+?\})\s*[,;]/);
        if (match) {
          try { runParams = { data: JSON.parse(match[1]) }; } catch { /* continuer */ }
        }
      }
    });

    const bizData = runParams?.data?.pageComponent?.bizData || {};
    const titleModule = bizData?.titleModule || {};
    const priceModule = bizData?.priceModule || {};
    const imageModule = bizData?.imageModule || {};
    const skuModule = bizData?.skuModule || {};

    // ── Nom du produit ──────────────────────────────────────
    const name =
      titleModule?.subject ||
      $('h1[data-pl="product-title"]').text().trim() ||
      $('[class*="title--wrap"] h1').text().trim() ||
      $('h1').first().text().trim() ||
      'Produit AliExpress';

    // ── Prix ────────────────────────────────────────────────
    const priceStr =
      priceModule?.minActivityAmount?.value ||
      priceModule?.minAmount?.value ||
      $('[class*="price--current"]').first().text().replace(/[^0-9.]/g, '') ||
      $('[class*="uniform-banner-box-price"]').first().text().replace(/[^0-9.]/g, '') ||
      '0';
    const price = parseFloat(String(priceStr)) || 0;

    const origStr =
      priceModule?.maxAmount?.value ||
      priceModule?.minActivityAmount?.formatedAmount?.replace(/[^0-9.]/g, '') ||
      priceStr;
    const originalPrice = parseFloat(String(origStr)) || price;

    // ── Images ──────────────────────────────────────────────
    let images: string[] = imageModule?.imagePathList || [];

    if (!images.length) {
      // Chercher dans les balises img
      $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || '';
        if (src.includes('alicdn.com') && !images.includes(src)) {
          images.push(src.replace(/_\d+x\d+\.(jpg|webp)/, '_640x640.$1'));
        }
      });
    }

    // Normaliser les URLs images
    images = images
      .filter(Boolean)
      .map(img => img.startsWith('//') ? `https:${img}` : img)
      .map(img => img.replace(/_\d+x\d+\.(jpg|webp)/, '_640x640.$1'))
      .slice(0, 10);

    // ── Description ─────────────────────────────────────────
    const description =
      $('[id*="description"]').text().trim().slice(0, 2000) ||
      $('[class*="description"]').first().text().trim().slice(0, 2000) ||
      name;

    // ── Variantes ───────────────────────────────────────────
    const variants: AliexpressVariant[] = [];
    const skuProps = skuModule?.productSKUPropertyList || [];
    if (skuProps.length > 0) {
      const firstProp = skuProps[0];
      for (const val of (firstProp?.skuPropertyValues || [])) {
        variants.push({
          name: val.propertyValueDisplayName || val.propertyValueName || '',
          price,
          stock: 10,
          image: val.skuPropertyImagePath
            ? (val.skuPropertyImagePath.startsWith('//')
               ? `https:${val.skuPropertyImagePath}`
               : val.skuPropertyImagePath)
            : undefined,
          attributes: { [firstProp?.skuPropertyName || 'Option']: val.propertyValueDisplayName || '' },
        });
      }
    }

    this.logger.log(`✅ Scraped : "${name}" — ${price} USD — ${images.length} images`);

    return {
      name,
      description,
      price,
      originalPrice,
      images,
      variants,
      stock: 100,
      aliexpressId,
      aliexpressUrl: url,
      rating: 0,
      soldCount: 0,
    };
  }

  async importProduct(url: string, categoryId?: string, markup: number = 30) {
    const scraped = await this.scrapeProduct(url);

    const salePrice = Math.round(scraped.price * (1 + markup / 100) * 655.957); // Convertir USD → XOF

    let slug = slugify(scraped.name, { lower: true, strict: true });
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const product = await this.prisma.product.create({
      data: {
        name: scraped.name,
        slug,
        description: scraped.description,
        price: salePrice,
        costPrice: Math.round(scraped.price * 655.957),
        comparePrice: Math.round(salePrice * 1.2),
        currency: 'XOF',
        stock: scraped.stock,
        aliexpressUrl: url,
        aliexpressId: scraped.aliexpressId,
        lastSyncAt: new Date(),
        categoryId: categoryId || null,
        images: {
          create: scraped.images.map((imgUrl, index) => ({
            url: imgUrl,
            sortOrder: index,
          })),
        },
        variants: scraped.variants.length > 0 ? {
          create: scraped.variants.map((v) => ({
            name: v.name,
            price: Math.round(v.price * (1 + markup / 100) * 655.957),
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

  async syncProductPrice(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product?.aliexpressUrl) return;

    try {
      const scraped = await this.scrapeProduct(product.aliexpressUrl);
      const costXOF = Math.round(scraped.price * 655.957);
      const markup = product.costPrice
        ? ((Number(product.price) - Number(product.costPrice)) / Number(product.costPrice)) * 100
        : 30;

      await this.prisma.product.update({
        where: { id: productId },
        data: {
          costPrice: costXOF,
          price: Math.round(costXOF * (1 + markup / 100)),
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
