import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Iyzipay = require('iyzipay');

@Injectable()
export class PaymentsService {
  private iyzipay: any;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {
    this.iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY || 'sandbox-api-key',
      secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret-key',
      uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
    });
  }

  async initializePayment(cafeId: string, userIp: string, userEmail: string, userName: string, billingInfo: InitializePaymentDto, baseUrl?: string) {
    const cafe = await this.prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) throw new BadRequestException('Cafe not found');

    // Get Admin User for more details if needed
    const admin = await this.prisma.cafeAdmin.findUnique({ where: { email: userEmail } });

    // Ensure Card User Key exists
    let cardUserKey = cafe.iyzicoCardUserKey;
    
    // Determine price and duration based on plan type
    const isYearly = billingInfo.planDuration === 'yearly';
    const price = isYearly ? '4990.00' : '499.00';
    const planName = isYearly ? 'QR Team Cafe Pro Plan (1 Yıllık)' : 'QR Team Cafe Pro Plan (1 Aylık)';
    const planId = isYearly ? 'PRO_PLAN_1_YEAR' : 'PRO_PLAN_1_MONTH';
    const planDuration = isYearly ? 'yearly' : 'monthly';

    // Use provided baseUrl or fallback to ENV/localhost
    const apiBase = baseUrl || process.env.API_URL || 'http://localhost:3001';
    const callbackUrl = `${apiBase}/payments/callback`;

    // Format current date for lastLoginDate (YYYY-MM-DD HH:mm:ss)
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').split('.')[0];

    // Helper to split name
    const nameParts = billingInfo.contactName.trim().split(' ');
    const surname = nameParts.length > 1 ? nameParts.pop() : 'User';
    const name = nameParts.join(' ') || 'Admin';

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: cafeId,
      price: price,
      paidPrice: price,
      currency: Iyzipay.CURRENCY.TRY,
      // Encode planDuration in basketId: BASKET-{cafeId}-{planDuration}-{timestamp}
      basketId: `BASKET-${cafeId}-${planDuration}-${Date.now()}`,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: callbackUrl,
      ...(cardUserKey ? { cardUserKey: cardUserKey } : {}),
      enabledInstallments: [2, 3, 6, 9],
      buyer: {
        id: admin?.id || cafeId,
        name: name,
        surname: surname,
        gsmNumber: billingInfo.gsmNumber || cafe.phone || '+905555555555',
        email: userEmail,
        identityNumber: billingInfo.identityNumber,
        lastLoginDate: formattedDate,
        registrationAddress: billingInfo.address,
        ip: userIp,
        city: billingInfo.city,
        country: billingInfo.country,
        zipCode: billingInfo.zipCode,
      },
      shippingAddress: {
        contactName: billingInfo.contactName,
        city: billingInfo.city,
        country: billingInfo.country,
        address: billingInfo.address,
        zipCode: billingInfo.zipCode,
      },
      billingAddress: {
        contactName: billingInfo.contactName,
        city: billingInfo.city,
        country: billingInfo.country,
        address: billingInfo.address,
        zipCode: billingInfo.zipCode,
      },
      basketItems: [
        {
          id: planId,
          name: planName,
          category1: 'Subscription',
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: price,
        },
      ],
    };

    // Helper for Iyzico Request
    const createCheckoutForm = (req: any) => {
      return new Promise((resolve, reject) => {
        this.iyzipay.checkoutFormInitialize.create(req, (err: any, result: any) => {
          // Iyzico SDK sometimes returns error in the first callback argument,
          // sometimes returns success object but with status: 'failure'.
          // We need to handle both.
          
          if (err) {
            // SDK Error
            reject(err);
          } else if (result.status === 'failure') {
            // API Error (e.g. cardUserKey not found)
            // Treat this as an error so our catch block can handle it
            const error: any = new Error(result.errorMessage || 'Iyzico API Error');
            error.errorMessage = result.errorMessage;
            error.errorCode = result.errorCode;
            reject(error);
          } else {
            // Success
            resolve(result);
          }
        });
      });
    };

    try {
      return await createCheckoutForm(request);
    } catch (err) {
      // If error is related to cardUserKey (e.g. not found because it was manually generated or deleted on Iyzico side)
      // We should clear the invalid key and retry without it.
      // Iyzico error messages usually contain the field name or a specific code, but checking message content is safer here.
      if (cardUserKey && (err?.errorMessage?.includes('cardUserKey') || (err?.message && err.message.includes('cardUserKey')))) {
         this.logger.warn(`Invalid cardUserKey detected for cafe ${cafeId}. Clearing key and retrying.`);
         
         // 1. Remove invalid key from DB
         await this.prisma.cafe.update({
            where: { id: cafeId },
            data: { iyzicoCardUserKey: null } 
         });
         
         // 2. Remove key from request
         delete request.cardUserKey;
         
         // 3. Retry
          return await createCheckoutForm(request);
       }
       throw err;
     }
   }

   async cancelSubscription(cafeId: string) {
    const cafe = await this.prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) throw new BadRequestException('Cafe not found');

    return this.prisma.cafe.update({
      where: { id: cafeId },
      data: {
        isSubscriptionActive: false,
        // We do NOT clear subscriptionEndsAt so the user can use the service until the paid period ends.
        // We do NOT clear iyzicoCardUserKey so they can easily resubscribe later without re-entering card details.
      },
    });
  }

   async verifyPayment(token: string) {
    return new Promise((resolve, reject) => {
      this.iyzipay.checkoutForm.retrieve({ token }, async (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
            let cafeId = result.conversationId;
            let planDuration = 'monthly';
            
            // Fallback: try to extract cafeId from basketId if conversationId is missing
            if (result.basketId && result.basketId.startsWith('BASKET-')) {
              // basketId format: BASKET-{cafeId}-{planDuration}-{timestamp}
              // OR OLD format: BASKET-{cafeId}-{timestamp}
              const parts = result.basketId.split('-');
              // parts[0] = BASKET
              // parts[1] = cafeId (UUID)
              // parts[2] = planDuration (monthly/yearly) OR timestamp
              // parts[3] = timestamp (if planDuration exists)

              // Check if we can extract cafeId from basketId if conversationId is missing
              if (!cafeId && parts.length >= 2) {
                 // UUIDs can contain dashes, so this simple split might be risky if we just took index 1.
                 // But wait, our previous fix used lastIndexOf. Let's stick to a more robust parsing if we controlled the generation.
                 // Since we generate: `BASKET-${cafeId}-${planDuration}-${Date.now()}`
                 // cafeId is a UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 groups, 4 dashes)
                 // BASKET-UUID-monthly-TIMESTAMP
                 // Total dashes = 1 (BASKET-) + 4 (UUID) + 1 (-monthly) + 1 (-TIMESTAMP) = 7 dashes.
                 
                 // If monthly/yearly is present:
                 // BASKET-UUID-monthly-123456789
                 
                 // If old format:
                 // BASKET-UUID-123456789
                 
                 // Let's try to parse planDuration first.
                 if (result.basketId.includes('-yearly-')) {
                   planDuration = 'yearly';
                 } else if (result.basketId.includes('-monthly-')) {
                   planDuration = 'monthly';
                 }

                 // If cafeId is missing, let's try to extract it.
                 // We know it is between BASKET- and -{planDuration}-... or -{timestamp}
                 if (!cafeId) {
                    const prefix = 'BASKET-';
                    let suffixIndex = -1;
                    if (planDuration === 'yearly') suffixIndex = result.basketId.lastIndexOf('-yearly-');
                    else if (planDuration === 'monthly') suffixIndex = result.basketId.lastIndexOf('-monthly-');
                    else suffixIndex = result.basketId.lastIndexOf('-'); // Old format fallback (timestamp)

                    if (suffixIndex > prefix.length) {
                      cafeId = result.basketId.substring(prefix.length, suffixIndex);
                    }
                 }
              } else {
                 // Try to detect plan duration even if cafeId is present
                 if (result.basketId.includes('-yearly-')) {
                   planDuration = 'yearly';
                 }
              }
            }

            if (!cafeId) {
              console.error('Payment successful but cafeId (conversationId) is missing in result:', JSON.stringify(result));
              resolve({ success: false, message: 'Payment successful but cannot identify cafe.', result });
              return;
            }

            // Update subscription
            const now = new Date();
            let endDate = new Date(now);
            if (planDuration === 'yearly') {
              endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
              endDate.setMonth(endDate.getMonth() + 1);
            }

            this.logger.log(`Payment Verified. Result: ${JSON.stringify(result)}`);
            if (result.cardUserKey) {
                this.logger.log(`Captured cardUserKey: ${result.cardUserKey}`);
            } else {
                this.logger.warn(`No cardUserKey returned in payment result. User might not have checked 'Store Card' or feature is disabled.`);
            }

            await this.prisma.cafe.update({
              where: { id: cafeId },
              data: {
                isSubscriptionActive: true,
                subscriptionEndsAt: endDate,
                plan: 'pro',
                subscriptionPeriod: planDuration,
                iyzicoSubReferenceCode: result.paymentId,
                // ALWAYS update cardUserKey if present in result, or use existing one if not returned but we have it.
                // Note: Checkout form result usually contains cardUserKey if 'cardUserKey' was passed during init OR if it was a new card registration.
                // However, if the user paid with a NEW card and saved it, result.cardUserKey should be populated.
                ...(result.cardUserKey ? { iyzicoCardUserKey: result.cardUserKey } : {}),
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

  async listStoredCards(cafeId: string) {
    const cafe = await this.prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe || !cafe.iyzicoCardUserKey) {
      return [];
    }

    return new Promise((resolve, reject) => {
      this.iyzipay.cardList.retrieve({
        locale: Iyzipay.LOCALE.TR,
        cardUserKey: cafe.iyzicoCardUserKey,
      }, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          if (result.status === 'success') {
            resolve(result.cardDetails || []);
          } else {
            // If user not found or no cards, it might return failure or empty list. 
            // Usually failure if user key doesn't exist on iyzico side yet.
            resolve([]); 
          }
        }
      });
    });
  }

  async deleteStoredCard(cafeId: string, cardToken: string) {
    const cafe = await this.prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe || !cafe.iyzicoCardUserKey) {
      throw new BadRequestException('Card user key not found');
    }

    return new Promise((resolve, reject) => {
      this.iyzipay.card.delete({
        locale: Iyzipay.LOCALE.TR,
        cardUserKey: cafe.iyzicoCardUserKey,
        cardToken: cardToken,
      }, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          if (result.status === 'success') {
            resolve(result);
          } else {
            reject(new BadRequestException(result.errorMessage || 'Failed to delete card'));
          }
        }
      });
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async processAutomaticPayments() {
    this.logger.log('Starting automatic payment processing for expired subscriptions');
    
    const now = new Date();
    const expiredCafes = await this.prisma.cafe.findMany({
      where: {
        isSubscriptionActive: true,
        subscriptionEndsAt: {
          lt: now,
        },
        iyzicoCardUserKey: {
          not: null,
        },
      },
    });

    this.logger.log(`Found ${expiredCafes.length} expired subscriptions to process.`);

    for (const cafe of expiredCafes) {
      try {
        await this.processPaymentForCafe(cafe);
      } catch (error) {
        this.logger.error(`Failed to process payment for cafe ${cafe.id}: ${error.message}`);
      }
    }
  }

  private async processPaymentForCafe(cafe: any) {
    // 1. Get Stored Card
    const cards: any = await this.listStoredCards(cafe.id);
    if (!cards || cards.length === 0) {
        this.logger.warn(`No stored cards for cafe ${cafe.id}, skipping auto-payment.`);
        await this.prisma.cafe.update({ where: { id: cafe.id }, data: { isSubscriptionActive: false } });
        return;
    }
    // Use the first card
    const cardToken = cards[0].cardToken;

    // 2. Determine Price and Duration
    const isYearly = cafe.subscriptionPeriod === 'yearly';
    const price = isYearly ? '4990.00' : '499.00';
    const planName = isYearly ? 'QR Team Cafe Pro Plan (1 Yıllık) - Auto Renewal' : 'QR Team Cafe Pro Plan (1 Aylık) - Auto Renewal';
    const planId = isYearly ? 'PRO_PLAN_1_YEAR' : 'PRO_PLAN_1_MONTH';

    // 3. Create Payment Request
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: cafe.id,
      price: price,
      paidPrice: price,
      currency: Iyzipay.CURRENCY.TRY,
      installment: '1',
      basketId: `AUTO-${cafe.id}-${Date.now()}`,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: {
        cardUserKey: cafe.iyzicoCardUserKey,
        cardToken: cardToken,
      },
      buyer: {
        id: cafe.id,
        name: cafe.authorizedPerson || 'Cafe Admin',
        surname: 'User',
        gsmNumber: cafe.phone || '+905555555555',
        email: cafe.email || 'info@qrteamcafe.com',
        identityNumber: '11111111111',
        lastLoginDate: new Date().toISOString().replace('T', ' ').split('.')[0],
        registrationAddress: cafe.address || 'Turkey',
        ip: '127.0.0.1',
        city: cafe.city || 'Istanbul',
        country: 'Turkey',
        zipCode: '34000',
      },
      shippingAddress: {
        contactName: cafe.authorizedPerson || cafe.name,
        city: cafe.city || 'Istanbul',
        country: 'Turkey',
        address: cafe.address || 'Turkey',
        zipCode: '34000',
      },
      billingAddress: {
        contactName: cafe.authorizedPerson || cafe.name,
        city: cafe.city || 'Istanbul',
        country: 'Turkey',
        address: cafe.address || 'Turkey',
        zipCode: '34000',
      },
      basketItems: [
        {
          id: planId,
          name: planName,
          category1: 'Subscription',
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: price,
        },
      ],
    };

    // 4. Execute Payment
    await new Promise((resolve, reject) => {
      this.iyzipay.payment.create(request, async (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          if (result.status === 'success') {
            // 5. Update Subscription on Success
            const now = new Date();
            let endDate = new Date(now);
            if (isYearly) {
              endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
              endDate.setMonth(endDate.getMonth() + 1);
            }

            await this.prisma.cafe.update({
              where: { id: cafe.id },
              data: {
                subscriptionEndsAt: endDate,
                isSubscriptionActive: true,
                iyzicoSubReferenceCode: result.paymentId,
              },
            });
            this.logger.log(`Auto-payment successful for cafe ${cafe.id}. New end date: ${endDate}`);
            resolve(result);
          } else {
            this.logger.error(`Payment failed for cafe ${cafe.id}: ${result.errorMessage}`);
             await this.prisma.cafe.update({
                 where: { id: cafe.id },
                 data: { isSubscriptionActive: false }
             });
            resolve(result);
          }
        }
      });
    });
  }
}
