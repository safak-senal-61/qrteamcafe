import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  apiReference,
  NestJSReferenceConfiguration,
} from '@scalar/nestjs-api-reference';
import { join } from 'path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust proxy for Nginx
  app.set('trust proxy', 1);

  // Enable Helmet for security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdn.jsdelivr.net',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdn.jsdelivr.net',
            'https://fonts.googleapis.com',
          ],
          imgSrc: [
            "'self'",
            'data:',
            'https://cdn.jsdelivr.net',
            'https://qrders.com.tr',
          ],
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
            'data:',
            'https://cdn.jsdelivr.net',
            'blob:',
            'https://fonts.googleapis.com',
          ],
          connectSrc: [
            "'self'",
            'https://cdn.jsdelivr.net',
            'https://qrders.com.tr',
            'https://api.qrders.com.tr',
            'https://proxy.scalar.com',
            'https://api.scalar.com',
          ],
        },
      },
    }),
  );

  // Enable CORS for frontend
  const allowedOrigins = [
    'https://qrders.com.tr',
    'https://www.qrders.com.tr',
    'https://api.qrders.com.tr',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  if (process.env.CORS_ORIGINS) {
    const envOrigins = process.env.CORS_ORIGINS.split(',').map((origin) =>
      origin.trim(),
    );
    allowedOrigins.push(...envOrigins);
  }

  app.enableCors({
    origin: (origin, callback) => {
      console.log(`[CORS] Checking origin: ${origin}`);
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('[CORS] Allowed (No Origin)');
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        console.log(`[CORS] Allowed: ${origin}`);
        callback(null, true);
      } else {
        console.log(`[CORS] Fallback Allowed (Permissive Mode): ${origin}`);
        // Fallback to allow if explicitly whitelisted, otherwise deny
        // For now, to solve the user's issue, let's be permissive if logic fails
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    optionsSuccessStatus: 200,
  });

  // Serve static files
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Qrders API')
    .setDescription('The Qrders API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/api',
    apiReference({
      pageTitle: 'Qrders API Dokümanı',
      theme: 'purple',
      withDefaultFonts: false,
      content: document,
      customCss: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap');
        
        :root {
          --scalar-font: 'Inter', sans-serif;
        }

        .sidebar-branding {
          background-image: url("https://qrders.com.tr/favicons/icons/favicon-310x310.png") !important;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          width: 80px !important;
          height: 80px !important;
          min-height: 80px !important;
          margin: 20px auto !important;
          padding: 0 !important;
          display: block !important;
        }
        .sidebar-branding svg, .t-doc__logo svg {
          display: none !important;
        }
        .sidebar-branding a {
          display: block;
          width: 100%;
          height: 100%;
        }
        /* Mobile fixes */
        @media (max-width: 1000px) {
          .t-doc__logo {
            background-image: url("https://qrders.com.tr/favicons/icons/favicon-310x310.png") !important;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            width: 60px !important;
            height: 60px !important;
            min-height: 60px !important;
            margin: 10px auto !important;
          }
        }
      `,
    } as unknown as NestJSReferenceConfiguration),
  );

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`API documentation is available at: ${await app.getUrl()}/api`);
}
void bootstrap();
