import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';
import axios from 'axios';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('favicon.ico')
  favicon(@Res() res: Response) {
    res.redirect('https://qrders.com.tr/favicons/icons/favicon-32x32.png');
  }

  @Get()
  root(@Res() res: Response) {
    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Qrders API Servisi</title>
        <link rel="icon" type="image/png" href="https://qrders.com.tr/favicons/icons/favicon-32x32.png">
        <link rel="apple-touch-icon" href="https://qrders.com.tr/favicons/icons/favicon-180x180.png">
        <style>
          :root {
            --primary: #FF4F00;
            --primary-dark: #cc3f00;
            --bg: #f8fafc;
            --text: #1e293b;
            --text-muted: #64748b;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            line-height: 1.6;
          }
          .card {
            background: white;
            padding: 3rem;
            border-radius: 1.5rem;
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
            max-width: 480px;
            width: 90%;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .logo {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 2rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          h1 {
            font-size: 1.875rem;
            font-weight: 800;
            margin-bottom: 0.75rem;
            letter-spacing: -0.025em;
            color: #0f172a;
          }
          p {
            color: var(--text-muted);
            margin-bottom: 2rem;
            font-size: 1.1rem;
          }
          .contact-info {
            background: #f1f5f9;
            padding: 1.5rem;
            border-radius: 1rem;
            margin-bottom: 2rem;
            text-align: left;
          }
          .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 0.75rem;
            color: #334155;
            font-weight: 500;
          }
          .contact-item:last-child {
            margin-bottom: 0;
          }
          .contact-item svg {
            width: 20px;
            height: 20px;
            margin-right: 0.75rem;
            color: var(--primary);
          }
          .btn-group {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          .btn {
            display: inline-block;
            background: var(--primary);
            color: white;
            padding: 0.875rem 2rem;
            border-radius: 0.75rem;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 4px 6px -1px rgba(255, 79, 0, 0.2);
          }
          .btn:hover {
            background: var(--primary-dark);
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(255, 79, 0, 0.3);
          }
          .btn-outline {
            background: transparent;
            color: var(--primary);
            border: 2px solid var(--primary);
            box-shadow: none;
          }
          .btn-outline:hover {
            background: var(--primary);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(255, 79, 0, 0.2);
          }
          .social-links {
            margin-top: 2rem;
            display: flex;
            justify-content: center;
            gap: 1rem;
          }
          .social-link {
            color: var(--text-muted);
            transition: color 0.2s;
          }
          .social-link:hover {
            color: var(--primary);
          }
          @media (max-width: 480px) {
            .card {
              width: 100%;
              max-width: none;
              border-radius: 0;
              box-shadow: none;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              border: none;
              padding: 2rem;
            }
            .btn {
              width: 100%;
              text-align: center;
              box-sizing: border-box;
            }
            .btn-group {
              flex-direction: column;
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">
            <img src="https://qrders.com.tr/favicons/icons/favicon-310x310.png" alt="Qrders Logo" />
          </div>
          <h1>Qrders API Servisi</h1>
          <p>
            Bu sunucu Qrders QR Menü ve Sipariş Yönetim Sistemi için arka uç API hizmeti sağlamaktadır.
          </p>
          
          <div class="contact-info">
            <div class="contact-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              destek@qrders.com.tr
            </div>
            <div class="contact-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 12.284 3 6V5z"></path></svg>
              +90 850 123 45 67
            </div>
          </div>

          <div class="btn-group">
            <a href="https://qrders.com.tr" class="btn">Web Sitesine Git</a>
            <a href="https://api.qrders.com.tr/api" class="btn btn-outline">API Kullanım Dokümanı</a>
          </div>

          <div class="social-links">
            <a href="#" class="social-link">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </a>
            <a href="#" class="social-link">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          </div>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  }

  @Get('system-status')
  async getSystemStatus() {
    const status = await this.appService.getSystemStatus();
    return status;
  }

  @Get('stats')
  async getPublicStats() {
    return this.appService.getPublicStats();
  }

  @Post('contact-support')
  async contactSupport(@Body() body: { email: string; message: string }) {
    await this.appService.sendSupportEmail(body.email, body.message);
    return { success: true };
  }

  @Get('proxy-image')
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    try {
      if (!url) {
        return res.status(400).send('URL is required');
      }

      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
      });

      res.set('Content-Type', response.headers['content-type'] as string);
      res.set('Access-Control-Allow-Origin', '*'); // Enable CORS for this endpoint

      response.data.pipe(res);
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).send('Failed to fetch image');
    }
  }
}
