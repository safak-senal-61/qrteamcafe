import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Iyzipay = require('iyzipay');

@Injectable()
export class PaymentsService {
  private iyzipay: any;

  constructor(private prisma: PrismaService) {
    this.iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY || 'sandbox-api-key',
      secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret-key',
      uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
    });
  }

  async initializePayment(cafeId: string, userIp: string, userEmail: string, userName: string, baseUrl?: string) {
    const cafe = await this.prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) throw new BadRequestException('Cafe not found');

    const price = '499.00';
    // Use provided baseUrl or fallback to ENV/localhost
    const apiBase = baseUrl || process.env.API_URL || 'http://localhost:3001';
    const callbackUrl = `${apiBase}/payments/callback`;

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: cafeId,
      price: price,
      paidPrice: price,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: `BASKET-${cafeId}-${Date.now()}`,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: callbackUrl,
      enabledInstallments: [2, 3, 6, 9],
      buyer: {
        id: cafeId,
        name: userName.split(' ')[0] || 'Admin',
        surname: userName.split(' ').slice(1).join(' ') || 'User',
        gsmNumber: cafe.phone || '+905555555555',
        email: userEmail,
        identityNumber: '11111111111', // Dummy for now, or get from user
        lastLoginDate: '2015-10-05 12:43:35',
        registrationAddress: cafe.address || 'Istanbul',
        ip: userIp,
        city: cafe.city || 'Istanbul',
        country: 'Turkey',
        zipCode: '34732',
      },
      shippingAddress: {
        contactName: userName,
        city: cafe.city || 'Istanbul',
        country: 'Turkey',
        address: cafe.address || 'Istanbul',
        zipCode: '34732',
      },
      billingAddress: {
        contactName: userName,
        city: cafe.city || 'Istanbul',
        country: 'Turkey',
        address: cafe.address || 'Istanbul',
        zipCode: '34732',
      },
      basketItems: [
        {
          id: 'PRO_PLAN_1_MONTH',
          name: 'QR Team Cafe Pro Plan (1 Aylık)',
          category1: 'Subscription',
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: price,
        },
      ],
    };

    return new Promise((resolve, reject) => {
      this.iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  async verifyPayment(token: string) {
    return new Promise((resolve, reject) => {
      this.iyzipay.checkoutForm.retrieve({ token }, async (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
            const cafeId = result.conversationId;
            // Update subscription
            const now = new Date();
            const oneMonthLater = new Date(now.setMonth(now.getMonth() + 1));

            await this.prisma.cafe.update({
              where: { id: cafeId },
              data: {
                isSubscriptionActive: true,
                subscriptionEndsAt: oneMonthLater,
                plan: 'pro',
                iyzicoSubReferenceCode: result.paymentId,
              },
            });
            resolve({ success: true, message: 'Payment successful', cafeId });
          } else {
            resolve({ success: false, message: 'Payment failed', result });
          }
        }
      });
    });
  }
}
