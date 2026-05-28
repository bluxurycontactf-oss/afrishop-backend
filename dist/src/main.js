"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressApp = void 0;
exports.createNestApp = createNestApp;
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const app_module_1 = require("./app.module");
const express = require("express");
exports.expressApp = express();
let app = null;
async function createNestApp() {
    if (app)
        return app;
    app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(exports.expressApp));
    app.enableCors({
        origin: [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            /\.web\.app$/,
            /\.netlify\.app$/,
            /\.firebaseapp\.com$/,
            'http://localhost:3000',
        ],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('AfriShop API')
        .setDescription('API Dropshipping AliExpress Afrique')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    await app.init();
    return app;
}
async function bootstrap() {
    await createNestApp();
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`\n🚀 AfriShop API démarrée sur http://localhost:${port}`);
    console.log(`📚 Documentation : http://localhost:${port}/docs\n`);
}
if (process.env.FUNCTION_TARGET === undefined && process.env.K_SERVICE === undefined) {
    bootstrap();
}
//# sourceMappingURL=main.js.map