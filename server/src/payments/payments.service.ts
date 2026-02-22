import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import type { Cafe } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

const Iyzipay = require('iyzipay');

const toSafeString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  if (value instanceof Error) return value.message || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

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

  async createCardUser(cafeId: string, email: string) {
    return new Promise((resolve, reject) => {
      this.iyzipay.cardUser.create(
        {
          locale: Iyzipay.LOCALE.TR,
          conversationId: cafeId,
          email: email,
          externalId: cafeId,
        },
        async (err: any, result: any) => {
          if (err) {
            this.logger.error('Iyzico Card User Creation Error', err);
            resolve(null);
          } else {
            if (result.status === 'success' && result.cardUserKey) {
              // Save to DB
              await this.prisma.cafe.update({
                where: { id: cafeId },
                data: { iyzicoCardUserKey: result.cardUserKey },
              });
              resolve(result.cardUserKey);
            } else {
              this.logger.warn('Iyzico Card User Creation Failed', result);
              resolve(null);
            }
          }
        },
      );
    });
  }

  async initializePayment(
    cafeId: string,
    userIp: string,
    userEmail: string,
    userName: string,
    billingInfo: InitializePaymentDto,
    baseUrl?: string,
  ) {
    const cafe = await this.prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) throw new BadRequestException('Cafe not found');

    // Get Admin User for more details if needed
    const admin = await this.prisma.cafeAdmin.findUnique({
      where: { email: userEmail },
    });

    // Ensure Card User Key exists and is valid
    let cardUserKey = cafe.iyzicoCardUserKey;

    // Validate existing key
    if (cardUserKey) {
      try {
        // Try to list cards to see if the key is valid
        await new Promise((resolve, reject) => {
          this.iyzipay.cardList.retrieve(
            {
              locale: Iyzipay.LOCALE.TR,
              cardUserKey: cardUserKey,
            },
            (err: any, result: any) => {
              if (err) reject(err);
              else if (result.status !== 'success')
                reject(
                  new Error(
                    toSafeString(result.errorMessage, 'Iyzico API Error'),
                  ),
                );
              else resolve(result);
            },
          );
        });
      } catch (error) {
        this.logger.warn(
          `Existing cardUserKey ${cardUserKey} is invalid or belongs to another env. Rotating...`,
        );
        cardUserKey = null; // Force recreation
        // Update DB to null first to avoid confusion if creation fails
        await this.prisma.cafe.update({
          where: { id: cafeId },
          data: { iyzicoCardUserKey: null },
        });
      }
    }

    // If no cardUserKey exists (or was invalid), create one immediately
    if (!cardUserKey) {
      this.logger.log(
        `No cardUserKey found for cafe ${cafeId}, creating one...`,
      );
      try {
        const newKey = await this.createCardUser(cafeId, userEmail);
        if (newKey) {
          cardUserKey = newKey as string;
          this.logger.log(`Created new cardUserKey: ${cardUserKey}`);
        }
      } catch (e) {
        this.logger.error(
          'Failed to create card user during initialization',
          e,
        );
      }
    }

    // Check mode
    const isUpdateCardMode = billingInfo.mode === 'update_card';

    // Determine price and duration based on plan type or mode
    let isYearly = billingInfo.planDuration === 'yearly';
    let durationMonths = 1;
    let planDuration = 'monthly';

    if (billingInfo.planDuration === 'yearly') {
      durationMonths = 12;
      planDuration = 'yearly';
    } else if (billingInfo.planDuration === 'monthly') {
      durationMonths = 1;
      planDuration = 'monthly';
    } else if (
      billingInfo.planDuration &&
      billingInfo.planDuration.endsWith('_months')
    ) {
      const m = parseInt(billingInfo.planDuration.split('_')[0]);
      if (!isNaN(m) && m > 0) {
        durationMonths = m;
        planDuration = billingInfo.planDuration;
        if (m === 12) {
          isYearly = true;
          planDuration = 'yearly';
        }
      }
    }

    // Fetch dynamic pricing
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        key: { in: ['PRICING_MONTHLY', 'PRICING_YEARLY'] },
      },
    });

    let monthlyPrice = 499;
    let yearlyPrice = 4990;

    const monthlySetting = settings.find((s) => s.key === 'PRICING_MONTHLY');
    const yearlySetting = settings.find((s) => s.key === 'PRICING_YEARLY');

    if (monthlySetting) monthlyPrice = parseFloat(monthlySetting.value);
    if (yearlySetting) yearlyPrice = parseFloat(yearlySetting.value);

    let price = isYearly
      ? yearlyPrice.toFixed(2)
      : (durationMonths * monthlyPrice).toFixed(2);
    let planName = isYearly
      ? 'qrders Pro Plan (1 Yıllık)'
      : `qrders Pro Plan (${durationMonths} Aylık)`;
    let planId = isYearly
      ? 'PRO_PLAN_1_YEAR'
      : `PRO_PLAN_${durationMonths}_MONTHS`;

    if (isUpdateCardMode) {
      price = '1.00';
      planName = 'Kart Güncelleme / Doğrulama (İade Edilir)';
      planId = 'CARD_UPDATE_VERIFY';
      // Use a special duration tag or keep monthly but mark as update_card in basketId
    }

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

    // Basket ID Construction
    // Standard: BASKET-{cafeId}-{planDuration}-{timestamp}
    // Update: BASKET-{cafeId}-update_card-{timestamp}
    const basketId = isUpdateCardMode
      ? `BASKET-${cafeId}-update_card-${Date.now()}`
      : `BASKET-${cafeId}-${planDuration}-${Date.now()}`;

    this.logger.log(
      `Initializing payment for cafe ${cafeId}. Mode: ${billingInfo.mode}, CardUserKey: ${cardUserKey || 'NONE'}`,
    );

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: cafeId,
      price: price,
      paidPrice: price,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: basketId,
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
        this.iyzipay.checkoutFormInitialize.create(
          req,
          (err: any, result: any) => {
            // Iyzico SDK sometimes returns error in the first callback argument,
            // sometimes returns success object but with status: 'failure'.
            // We need to handle both.

            if (err) {
              // SDK Error
              reject(err);
            } else if (result.status === 'failure') {
              // API Error (e.g. cardUserKey not found)
              // Treat this as an error so our catch block can handle it
              const error: any = new Error(
                toSafeString(result.errorMessage, 'Iyzico API Error'),
              );
              error.errorMessage = toSafeString(result.errorMessage);
              error.errorCode = result.errorCode;
              reject(error);
            } else {
              // Success
              resolve(result);
            }
          },
        );
      });
    };

    try {
      return await createCheckoutForm(request);
    } catch (err) {
      // If error is related to cardUserKey (e.g. not found because it was manually generated or deleted on Iyzico side)
      // We should clear the invalid key and retry without it.
      // Iyzico error messages usually contain the field name or a specific code, but checking message content is safer here.
      if (
        cardUserKey &&
        (err?.errorMessage?.includes('cardUserKey') ||
          (err?.message && err.message.includes('cardUserKey')))
      ) {
        this.logger.warn(
          `Invalid cardUserKey detected for cafe ${cafeId}. Clearing key and retrying.`,
        );

        // 1. Remove invalid key from DB
        await this.prisma.cafe.update({
          where: { id: cafeId },
          data: { iyzicoCardUserKey: null },
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
      this.iyzipay.checkoutForm.retrieve(
        { token },
        async (err: any, result: any) => {
          try {
            if (err) {
              reject(err);
              return;
            }

            if (
              result.status === 'success' &&
              result.paymentStatus === 'SUCCESS'
            ) {
              let cafeId = toSafeString(result.conversationId);
              let planDuration = 'monthly';

              // Extract info from basketId if needed or to get planDuration
              if (result.basketId && result.basketId.startsWith('BASKET-')) {
                // Format: BASKET-{cafeId}-{planDuration}-{timestamp}
                // Safer extraction from end since cafeId (UUID) might contain dashes
                const lastDashIndex = result.basketId.lastIndexOf('-');
                if (lastDashIndex > 0) {
                  const remaining = result.basketId.substring(0, lastDashIndex); // Removes timestamp
                  const secondLastDashIndex = remaining.lastIndexOf('-');

                  if (secondLastDashIndex > 0) {
                    const extractedDuration = remaining.substring(
                      secondLastDashIndex + 1,
                    );

                    if (
                      extractedDuration === 'monthly' ||
                      extractedDuration === 'yearly' ||
                      extractedDuration.endsWith('_months') ||
                      extractedDuration === 'update_card'
                    ) {
                      planDuration = extractedDuration;

                      if (!cafeId) {
                        const cafeIdWithPrefix = remaining.substring(
                          0,
                          secondLastDashIndex,
                        );
                        if (cafeIdWithPrefix.startsWith('BASKET-')) {
                          cafeId = toSafeString(cafeIdWithPrefix.substring(7));
                        }
                      }
                    }
                  }
                }
              }

              if (!cafeId) {
                const errorMsg = `Payment successful but cannot identify cafe. conversationId: ${result.conversationId}, basketId: ${result.basketId}`;
                this.logger.error(errorMsg, JSON.stringify(result));
                resolve({ success: false, message: errorMsg, result });
                return;
              }

              // Check for update_card mode
              const isUpdateCardMode =
                planDuration === 'update_card' ||
                result.basketId?.includes('-update_card-');

              if (isUpdateCardMode) {
                this.logger.log(
                  `Update Card Mode detected for cafe ${cafeId}.`,
                );

                // If cardUserKey is present, update it
                const returnedCardUserKey =
                  result.cardUserKey ||
                  (result.paymentCard && result.paymentCard.cardUserKey);

                if (returnedCardUserKey) {
                  await this.prisma.cafe.update({
                    where: { id: cafeId },
                    data: { iyzicoCardUserKey: returnedCardUserKey },
                  });
                  result.cardUserKey = returnedCardUserKey;
                } else {
                  // Fallback check for stored cards
                  try {
                    const storedCards: any[] =
                      await this.listStoredCards(cafeId);
                    if (storedCards.length > 0) {
                      result.cardUserKey = (
                        await this.prisma.cafe.findUnique({
                          where: { id: cafeId },
                        })
                      )?.iyzicoCardUserKey;
                    }
                  } catch (e) {
                    this.logger.error(
                      'Failed to check stored cards during verification fallback',
                      e,
                    );
                  }
                }

                // Refund the 1 TL verification amount
                try {
                  if (result.paymentId) {
                    await this.refundPayment(
                      toSafeString(result.paymentId),
                      toSafeString(result.price, '1.00'),
                      cafeId,
                    );
                  }
                } catch (refundError) {
                  this.logger.error(
                    `Failed to refund verification payment: ${refundError.message}`,
                  );
                }

                resolve({
                  success: true,
                  message: 'Card updated successfully',
                  cafeId,
                  mode: 'update_card',
                  cardStored: !!result.cardUserKey,
                });
                return;
              }

              // Update subscription logic
              const cafe = await this.prisma.cafe.findUnique({
                where: { id: cafeId },
              });

              const now = new Date();
              let endDate = new Date(now);

              // If subscription is active and not expired, extend from existing end date
              if (
                cafe &&
                cafe.isSubscriptionActive &&
                cafe.subscriptionEndsAt &&
                cafe.subscriptionEndsAt > now
              ) {
                endDate = new Date(cafe.subscriptionEndsAt);
              }

              let monthsToAdd = 1;
              if (planDuration === 'yearly') {
                monthsToAdd = 12;
              } else if (planDuration.endsWith('_months')) {
                const m = parseInt(planDuration.split('_')[0]);
                if (!isNaN(m) && m > 0) monthsToAdd = m;
              }

              // Add months
              endDate.setMonth(endDate.getMonth() + monthsToAdd);

              this.logger.log(
                `Payment Verified. Cafe: ${cafeId}, Duration: ${planDuration}, New End Date: ${endDate}, CardStored: ${!!result.cardUserKey}`,
              );

              await this.prisma.cafe.update({
                where: { id: cafeId },
                data: {
                  isSubscriptionActive: true,
                  subscriptionEndsAt: endDate,
                  plan: 'pro',
                  subscriptionPeriod: planDuration,
                  iyzicoSubReferenceCode: result.paymentId,
                  // Eğer kart kaydedildiyse (kullanıcı ödeme ekranında seçtiyse) kaydet
                  ...(result.cardUserKey
                    ? { iyzicoCardUserKey: result.cardUserKey }
                    : {}),
                },
              });
              resolve({
                success: true,
                message: 'Payment successful',
                cafeId,
                cardStored: !!result.cardUserKey,
              });
            } else {
              resolve({ success: false, message: 'Payment failed', result });
            }
          } catch (error) {
            this.logger.error(
              'Error during payment verification callback',
              error,
            );
            reject(error);
          }
        },
      );
    });
  }

  async listStoredCards(cafeId: string): Promise<any[]> {
    const cafe = await this.prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe || !cafe.iyzicoCardUserKey) {
      this.logger.debug(`listStoredCards: No cardUserKey for cafe ${cafeId}`);
      return [];
    }

    return new Promise<any[]>((resolve, reject) => {
      this.logger.debug(
        `Listing stored cards for cafe ${cafeId} using key ${cafe.iyzicoCardUserKey}`,
      );
      this.iyzipay.cardList.retrieve(
        {
          locale: Iyzipay.LOCALE.TR,
          cardUserKey: cafe.iyzicoCardUserKey,
        },
        (err: any, result: any) => {
          if (err) {
            this.logger.error(`Error listing cards for cafe ${cafeId}`, err);
            reject(err);
          } else {
            if (result.status === 'success') {
              this.logger.debug(
                `Found ${result.cardDetails?.length || 0} cards for cafe ${cafeId}`,
              );
              const cardDetails: any[] = Array.isArray(result.cardDetails)
                ? result.cardDetails
                : [];
              resolve(cardDetails);
            } else {
              // If user not found or no cards, it might return failure or empty list.
              // Usually failure if user key doesn't exist on iyzico side yet.
              resolve([]);
            }
          }
        },
      );
    });
  }

  async deleteStoredCard(cafeId: string, cardToken: string) {
    const cafe = await this.prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe || !cafe.iyzicoCardUserKey) {
      throw new BadRequestException('Card user key not found');
    }

    return new Promise((resolve, reject) => {
      this.iyzipay.card.delete(
        {
          locale: Iyzipay.LOCALE.TR,
          cardUserKey: cafe.iyzicoCardUserKey,
          cardToken: cardToken,
        },
        (err: any, result: any) => {
          if (err) {
            reject(err);
          } else {
            if (result.status === 'success') {
              resolve(result);
            } else {
              reject(
                new BadRequestException(
                  result.errorMessage || 'Failed to delete card',
                ),
              );
            }
          }
        },
      );
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async processAutomaticPayments() {
    this.logger.log(
      'Starting automatic payment processing for expired subscriptions',
    );

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

    this.logger.log(
      `Found ${expiredCafes.length} expired subscriptions to process.`,
    );

    for (const cafe of expiredCafes) {
      try {
        await this.processPaymentForCafe(cafe);
      } catch (error) {
        this.logger.error(
          `Failed to process payment for cafe ${cafe.id}: ${error.message}`,
        );
      }
    }
  }

  private async processPaymentForCafe(cafe: Cafe) {
    // 1. Get Stored Card
    const cards: any = await this.listStoredCards(cafe.id);
    if (!cards || cards.length === 0) {
      this.logger.warn(
        `No stored cards for cafe ${cafe.id}, skipping auto-payment.`,
      );
      await this.prisma.cafe.update({
        where: { id: cafe.id },
        data: { isSubscriptionActive: false },
      });
      return;
    }
    // Use the first card
    const cardToken = cards[0].cardToken;

    // 2. Determine Price and Duration
    const isYearly = cafe.subscriptionPeriod === 'yearly';
    const price = isYearly ? '4990.00' : '499.00';
    const planName = isYearly
      ? 'qrders Pro Plan (1 Yıllık) - Auto Renewal'
      : 'qrders Pro Plan (1 Aylık) - Auto Renewal';
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
        email: cafe.email || 'info@qrders.com',
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
            const endDate = new Date(now);
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
            this.logger.log(
              `Auto-payment successful for cafe ${cafe.id}. New end date: ${endDate}`,
            );
            resolve(result);
          } else {
            this.logger.error(
              `Payment failed for cafe ${cafe.id}: ${result.errorMessage}`,
            );
            await this.prisma.cafe.update({
              where: { id: cafe.id },
              data: { isSubscriptionActive: false },
            });
            resolve(result);
          }
        }
      });
    });
  }

  async refundPayment(
    paymentId: string,
    price: string,
    conversationId: string,
  ) {
    return new Promise((resolve, reject) => {
      // First try to cancel (void) the payment since it is likely same-day
      this.iyzipay.cancel.create(
        {
          locale: Iyzipay.LOCALE.TR,
          conversationId: conversationId,
          paymentId: paymentId,
          ip: '127.0.0.1', // Server IP
        },
        (err: any, result: any) => {
          if (err) {
            reject(err);
          } else {
            if (result.status === 'success') {
              resolve(result);
            } else {
              // If cancel fails, reject with error message.
              reject(
                new Error(
                  toSafeString(result.errorMessage, 'Iyzico API Error'),
                ),
              );
            }
          }
        },
      );
    });
  }
}
