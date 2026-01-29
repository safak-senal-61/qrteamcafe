import { Controller, Post, Body, Res, UseGuards, Request, Get, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('initialize')
  async initializePayment(@Request() req: any, @Body() body: { ip: string }) {
    // req.user is populated by JwtAuthGuard
    // req.user: { id, email, name, role, cafeId }
    
    // We need user name, assuming it's in the token or we can fetch it. 
    // For now, let's use what we have in token (name might be missing in payload depending on strategy)
    // Checking JwtStrategy might be useful, but let's assume req.user has name or use default.
    
    const { cafeId, email, name } = req.user;
    
    // Construct base URL from request to support dynamic IPs (e.g. 10.133.x.x)
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    return this.paymentsService.initializePayment(cafeId, body.ip, email, name || 'Admin User', baseUrl);
  }

  @Post('callback')
  async callback(@Body() body: any, @Res() res: Response, @Request() req: any) {
    // Iyzico sends token in body for POST callback
    const { token } = body;
    
    // Construct frontend URL dynamically if possible, or fallback to ENV/localhost
    // Ideally FRONTEND_URL should be set, but we can try to infer from referer if available (unreliable)
    // For now stick to ENV or localhost:3000, but maybe use the request host to infer the IP for the frontend if on same network?
    // Assuming frontend is on port 3000 and same hostname as API (which is on 3001 usually).
    
    const protocol = req.protocol;
    const host = req.get('host'); // e.g. 10.133.193.253:3001
    const hostname = host.split(':')[0]; // 10.133.193.253
    const frontendUrl = process.env.FRONTEND_URL || `${protocol}://${hostname}:3000`;

    try {
      const result: any = await this.paymentsService.verifyPayment(token);
      
      if (result.success) {
        // Redirect to frontend success page
        return res.redirect(`${frontendUrl}/admin/dashboard?payment=success`);
      } else {
        // Redirect to frontend failure page
        return res.redirect(`${frontendUrl}/admin/dashboard?payment=failed&reason=${result.message}`);
      }
    } catch (error) {
       return res.redirect(`${frontendUrl}/admin/dashboard?payment=error`);
    }
  }
}
