import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@2024!', 10);
  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@africanshop.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@africanshop.com',
      password: adminPassword,
      name: 'Admin AfriShop',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Admin créé');

  // Catégories
  const categories = [
    { name: 'Téléphones & Accessoires', nameEn: 'Phones & Accessories', slug: 'phones', emoji: '📱' },
    { name: 'Mode & Vêtements', nameEn: 'Fashion & Clothing', slug: 'fashion', emoji: '👗' },
    { name: 'Maison & Jardin', nameEn: 'Home & Garden', slug: 'home', emoji: '🏠' },
    { name: 'Beauté & Santé', nameEn: 'Beauty & Health', slug: 'beauty', emoji: '💄' },
    { name: 'Électronique', nameEn: 'Electronics', slug: 'electronics', emoji: '💻' },
    { name: 'Sport & Loisirs', nameEn: 'Sports & Leisure', slug: 'sports', emoji: '⚽' },
    { name: 'Jouets & Enfants', nameEn: 'Toys & Kids', slug: 'toys', emoji: '🧸' },
    { name: 'Auto & Moto', nameEn: 'Auto & Moto', slug: 'auto', emoji: '🚗' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Catégories créées');

  // Fournisseur AliExpress
  await prisma.supplier.upsert({
    where: { id: 'aliexpress-main' },
    update: {},
    create: { id: 'aliexpress-main', name: 'AliExpress', website: 'https://aliexpress.com' },
  });
  console.log('✅ Fournisseur créé');

  console.log('\n🎉 Seed terminé !');
  console.log(`📧 Admin: ${process.env.ADMIN_EMAIL || 'admin@africanshop.com'}`);
  console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'Admin@2024!'}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
