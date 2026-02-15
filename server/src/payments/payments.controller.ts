import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Request,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import type { Request as ExpressRequest, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type PaymentRequestUser = {
  cafeId: string;
  email: string;
  name?: string | null;
};

type PaymentRequest = ExpressRequest & { user: PaymentRequestUser };

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('initialize')
  async initializePayment(
    @Request() req: PaymentRequest,
    @Body() body: InitializePaymentDto,
  ) {
    const { cafeId, email, name } = req.user;

    const protocol = req.protocol;
    const host = req.get('host') ?? 'localhost:3001';
    const baseUrl = `${protocol}://${host}`;

    return this.paymentsService.initializePayment(
      cafeId,
      body.ip,
      email,
      name || 'Admin User',
      body,
      baseUrl,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('cards')
  async listCards(@Request() req: PaymentRequest) {
    const { cafeId } = req.user;
    return this.paymentsService.listStoredCards(cafeId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cards/:cardToken')
  async deleteCard(
    @Request() req: PaymentRequest,
    @Param('cardToken') cardToken: string,
  ) {
    const { cafeId } = req.user;
    return this.paymentsService.deleteStoredCard(cafeId, cardToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel-subscription')
  async cancelSubscription(@Request() req: PaymentRequest) {
    const { cafeId } = req.user;
    return this.paymentsService.cancelSubscription(cafeId);
  }

  @Post('callback')
  async callback(
    @Body() body: { token?: string },
    @Res() res: Response,
    @Request() req: ExpressRequest,
  ) {
    const token = body.token;
    if (!token) {
      return res.status(400).send('Invalid token');
    }

    // Construct frontend URL dynamically if possible, or fallback to ENV/localhost
    // Ideally CLIENT_URL (or FRONTEND_URL) should be set in .env
    const protocol = req.protocol;
    const host = req.get('host') ?? 'localhost:3001';
    const hostname = host.split(':')[0] || 'localhost';
    
    // Use CLIENT_URL from env, or FRONTEND_URL, or fallback to localhost:3000
    const frontendUrl =
      process.env.CLIENT_URL || 
      process.env.FRONTEND_URL || 
      (hostname === 'localhost' ? `${protocol}://${hostname}:3000` : `${protocol}://${hostname}`);

    try {
      const result: any = await this.paymentsService.verifyPayment(token);

      if (result.success) {
        // Redirect to frontend success page
        const modeParam = result.mode ? `&mode=${result.mode}` : '';
        const cardStoredParam =
          result.cardStored !== undefined
            ? `&card_stored=${result.cardStored}`
            : '';
        return res.redirect(
          `${frontendUrl}/admin/dashboard?payment=success${modeParam}${cardStoredParam}`,
        );
      } else {
        // Redirect to frontend failure page
        return res.redirect(
          `${frontendUrl}/admin/dashboard?payment=failed&reason=${result.message}`,
        );
      }
    } catch (error) {
      return res.redirect(`${frontendUrl}/admin/dashboard?payment=error`);
    }
  }
}
