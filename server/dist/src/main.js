"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
const helmet_1 = __importDefault(require("helmet"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('QR Team Cafe API')
        .setDescription('The QR Team Cafe API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.listen(process.env.PORT ?? 3001);
    console.log(`Application is running on: ${await app.getUrl()}`);
    console.log(`Swagger documentation is available at: ${await app.getUrl()}/api`);
}
void bootstrap();
//# sourceMappingURL=main.js.map