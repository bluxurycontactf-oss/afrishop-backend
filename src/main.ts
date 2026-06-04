import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as express from 'express';

// ── Application Express partagée (pour Firebase Functions) ──
export const expressApp = express();
let app: any = null;

export async function createNestApp() {
  if (app) return app;

  app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  // Increase body size limit for base64 photo uploads (50MB)
  expressApp.use(express.json({ limit: '50mb' }));
  expressApp.use(express.urlencoded({ limit: '50mb', extended: true }));

  // CORS — accepte Netlify + Firebase + localhost
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      /\.web\.app$/,       // Firebase Hosting
      /\.netlify\.app$/,   // Netlify
      /\.firebaseapp\.com$/,
      'http://localhost:3000',
    ],
    credentials: true,
  });

  // Préfixe global — Firebase Hosting rewrite /api/** → Function
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('AfriShop API')
    .setDescription('API Dropshipping AliExpress Afrique')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.init();
  return app;
}

// ── Démarrage local (hors Firebase) ─────────────────────────
async function bootstrap() {
  await createNestApp();
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🚀 AfriShop API démarrée sur http://localhost:${port}`);
  console.log(`📚 Documentation : http://localhost:${port}/docs\n`);
}

// Lance le serveur seulement si on n'est pas dans Firebase Functions
if (process.env.FUNCTION_TARGET === undefined && process.env.K_SERVICE === undefined) {
  bootstrap();
}
