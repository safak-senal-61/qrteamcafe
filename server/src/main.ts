import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable Helmet for security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Enable CORS for frontend
  app.enableCors({
    origin: true, // Allow all origins (for development) or specify array of allowed origins
    credentials: true,
  });

  // Serve static files
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('QR Team Cafe API')
    .setDescription('The QR Team Cafe API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(
    `Swagger documentation is available at: ${await app.getUrl()}/api`,
  );
}
void bootstrap();
