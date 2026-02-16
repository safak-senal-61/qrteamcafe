import { Update, Ctx, Start, On, Action, Hears } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { TelegramService, UserState } from './telegram.service';
import { ConfigService } from '@nestjs/config';
import { EmailTarget } from '../super-admin/dto/send-announcement-email.dto';

@Update()
export class TelegramUpdate {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
  ) {}

  private isAdmin(ctx: Context): boolean {
    if (!ctx.from) return false;
    const adminId = this.configService.get<string>('TELEGRAM_ADMIN_ID');
    return ctx.from.id.toString() === adminId;
  }

  @Start()
  async start(@Ctx() ctx: Context) {
    if (!this.isAdmin(ctx)) {
      await ctx.reply('Bu botu kullanmaya yetkiniz yok.');
      return;
    }
    await ctx.reply(
      'Hoşgeldiniz Süper Admin!\n\nKomutlar:\n/sendmail - Duyuru maili gönder\n/pending - Bekleyen işletme başvuruları\n/cafes - Tüm işletmeleri listele\n/expiring - Süresi dolan abonelikler\n/financial - Finansal istatistikler\n/logs - Son şüpheli işlemler\n/settings - Sistem ayarları\n/maintenance - Bakım modu',
    );
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    if (!this.isAdmin(ctx) || !ctx.from) return;

    // Type assertion for message with text
    const message = ctx.message as any;
    if (!message || !message.text) return;

    const text = message.text as string;
    const userId = ctx.from.id;
    const session = this.telegramService.getSession(userId);

    if (text === '/sendmail') {
      this.telegramService.updateSession(userId, {
        state: UserState.WAITING_FOR_TARGET,
        data: {},
      });
      await ctx.reply(
        'Lütfen hedef kitleyi seçin:',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('Tüm Kafe Sahipleri', 'TARGET_ALL_OWNERS'),
            Markup.button.callback('Tüm Kullanıcılar', 'TARGET_ALL_USERS'),
          ],
          [
            Markup.button.callback('Herkes', 'TARGET_EVERYONE'),
            Markup.button.callback('Tek Bir İşletme', 'TARGET_SINGLE'),
          ],
        ]),
      );
      return;
    }

    if (text === '/pending') {
      const cafes = await this.telegramService.getPendingCafes();
      if (cafes.length === 0) {
        await ctx.reply('Bekleyen işletme başvurusu yok.');
        return;
      }

      for (const cafe of cafes) {
        const message = `
🏢 <b>${this.escapeHtml(cafe.name)}</b>
📍 ${this.escapeHtml(cafe.city || '-')} / ${this.escapeHtml(cafe.district || '-')}
📞 ${this.escapeHtml(cafe.phone || '-')}
👤 ${this.escapeHtml(cafe.authorizedPerson || '-')}
📅 ${new Date(cafe.createdAt).toLocaleDateString('tr-TR')}
        `;

        await ctx.replyWithHTML(
          message,
          Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ Onayla', `APPROVE_${cafe.id}`),
              Markup.button.callback('❌ Reddet', `REJECT_${cafe.id}`),
            ],
          ]),
        );
      }
      return;
    }

    if (text === '/cafes') {
      const cafes = await this.telegramService.getAllCafes();
      if (cafes.length === 0) {
        await ctx.reply('Kayıtlı işletme bulunamadı.');
        return;
      }

      let message = '🏢 <b>Kayıtlı İşletmeler (İlk 50):</b>\n\n';
      for (const cafe of cafes) {
        message += `🔹 <b>${this.escapeHtml(cafe.name)}</b>\n`;
      }
      await ctx.replyWithHTML(message);
      return;
    }

    if (text === '/expiring') {
      const cafes = await this.telegramService.getExpiringSubscriptions();
      if (cafes.length === 0) {
        await ctx.reply('Yakın zamanda aboneliği dolacak işletme yok.');
        return;
      }

      let message = '⚠️ <b>Aboneliği Dolmak Üzere Olanlar (7 Gün):</b>\n\n';
      for (const cafe of cafes) {
        const endDate = cafe.subscriptionEndsAt
          ? new Date(cafe.subscriptionEndsAt).toLocaleDateString('tr-TR')
          : '-';
        message += `🏢 <b>${this.escapeHtml(cafe.name)}</b>\n📅 Bitiş: ${endDate}\n📦 Plan: ${cafe.plan}\n\n`;
      }
      await ctx.replyWithHTML(message);
      return;
    }

    if (text === '/financial') {
      const stats = await this.telegramService.getFinancialStats();
      const message = `
💰 <b>Finansal İstatistikler</b>

🏢 <b>Plan Dağılımı:</b>
🔹 Trial: ${stats.trialCafes}
🔸 Pro: ${stats.proCafes}
💎 Enterprise: ${stats.enterpriseCafes}

✅ <b>Aktif Abonelikler:</b> ${stats.activeSubscriptions}

⚠️ <b>Yaklaşan Bitişler (7 Gün):</b> ${stats.expiringCafes.length}
      `;
      await ctx.replyWithHTML(message);
      return;
    }

    if (text === '/logs') {
      const logs = await this.telegramService.getRecentLogs();
      if (logs.length === 0) {
        await ctx.reply('Son kayıt bulunamadı.');
        return;
      }

      let message = '📋 <b>Son Şüpheli İşlemler:</b>\n\n';
      for (const log of logs) {
        const time = new Date(log.timestamp).toLocaleString('tr-TR');
        const user = log.waiter
          ? `${log.waiter.firstName} ${log.waiter.lastName}`
          : log.admin
            ? log.admin.name
            : 'Sistem';

        message += `🕒 ${time}\n🏢 ${this.escapeHtml(log.cafe?.name || '-')}\n👤 ${this.escapeHtml(user)}\n📝 ${this.escapeHtml(String(log.actionType))}\n⚠️ ${this.escapeHtml(log.details || '-')}\n\n`;
      }
      await ctx.replyWithHTML(message);
      return;
    }

    if (text === '/settings') {
      const settings = await this.telegramService.getSettings();
      if (Object.keys(settings).length === 0) {
        await ctx.reply('Ayar bulunamadı.');
        return;
      }

      let message = '⚙️ <b>Sistem Ayarları:</b>\n\n';
      for (const [key, value] of Object.entries(settings)) {
        message += `🔹 <b>${this.escapeHtml(key)}:</b> ${this.escapeHtml(String(value))}\n`;
      }
      await ctx.replyWithHTML(message);
      return;
    }

    if (text === '/maintenance') {
      const settings = await this.telegramService.getSettings();
      const isMaintenance = settings['maintenanceMode'] === 'true';

      const status = isMaintenance ? '✅ AÇIK' : '❌ KAPALI';
      const message = `🛠 <b>Bakım Modu</b>\n\nŞu anki durum: ${status}`;

      await ctx.replyWithHTML(
        message,
        Markup.inlineKeyboard([
          [
            Markup.button.callback('Aç', 'MAINTENANCE_ON'),
            Markup.button.callback('Kapat', 'MAINTENANCE_OFF'),
          ],
        ]),
      );
      return;
    }

    if (text === '/stats') {
      const stats = await this.telegramService.getStats();
      const message = `
📊 <b>Sistem İstatistikleri</b>

🏢 <b>Toplam İşletme:</b> ${stats.totalCafes}
⏳ <b>Bekleyen:</b> ${stats.pendingCafes}
✅ <b>Aktif:</b> ${stats.activeCafes}
❌ <b>Reddedilen:</b> ${stats.rejectedCafes}

👥 <b>Toplam Kullanıcı:</b> ${stats.totalUsers}
📦 <b>Toplam Sipariş:</b> ${stats.totalOrders}

💎 <b>Üyelik Durumu:</b>
🔹 <b>Deneme:</b> ${stats.subscriptionStats.trial}
🔸 <b>Premium:</b> ${stats.subscriptionStats.premium}
      `;
      await ctx.replyWithHTML(message);
      return;
    }

    if (text === '/cancel') {
      this.telegramService.clearSession(userId);
      await ctx.reply('İşlem iptal edildi.');
      return;
    }

    switch (session.state) {
      case UserState.WAITING_FOR_CAFE_SEARCH: {
        const cafes = await this.telegramService.searchCafes(text);
        if (cafes.length === 0) {
          await ctx.reply(
            'İşletme bulunamadı. Lütfen tekrar deneyin veya /cancel ile iptal edin.',
          );
        } else {
          const buttons = cafes.map((cafe) => [
            Markup.button.callback(cafe.name, `CAFE_${cafe.id}`),
          ]);
          this.telegramService.updateSession(userId, {
            state: UserState.WAITING_FOR_CAFE_SELECTION,
          });
          await ctx.reply(
            'Lütfen bir işletme seçin:',
            Markup.inlineKeyboard(buttons),
          );
        }
        break;
      }

      case UserState.WAITING_FOR_SUBJECT:
        this.telegramService.updateSession(userId, {
          state: UserState.WAITING_FOR_CONTENT,
          data: { ...session.data, subject: text },
        });
        await ctx.reply(
          'Harika! Şimdi e-posta içeriğini (HTML veya düz metin) girin:',
        );
        break;

      case UserState.WAITING_FOR_CONTENT: {
        this.telegramService.updateSession(userId, {
          state: UserState.CONFIRMATION,
          data: { ...session.data, content: text },
        });

        const targetName = this.getTargetName(session.data.target!);
        const cafeName = session.data.cafeName
          ? `(${this.escapeHtml(session.data.cafeName)})`
          : '';
        const subject = this.escapeHtml(session.data.subject || '');
        const contentPreview =
          this.escapeHtml(text.substring(0, 100)) +
          (text.length > 100 ? '...' : '');

        const summary = `
📝 <b>Özet:</b>
👤 <b>Hedef:</b> ${targetName} ${cafeName}
📌 <b>Konu:</b> ${subject}
📄 <b>İçerik:</b>
${contentPreview}

Onaylıyor musunuz?
        `;
        await ctx.replyWithHTML(
          summary,
          Markup.inlineKeyboard([
            [Markup.button.callback('Evet, Gönder', 'CONFIRM_YES')],
            [Markup.button.callback('Hayır, İptal', 'CONFIRM_NO')],
          ]),
        );
        break;
      }
    }
  }

  @Action(/^APPROVE_/)
  async onApproveCafe(@Ctx() ctx: Context) {
    if (!this.isAdmin(ctx)) return;
    const callbackQuery = ctx.callbackQuery as any;
    const data = callbackQuery.data as string;
    const cafeId = data.replace('APPROVE_', '');

    try {
      await this.telegramService.approveCafe(cafeId);
      await ctx.answerCbQuery('İşletme onaylandı!');
      await ctx.editMessageText(`✅ İşletme onaylandı!\nID: ${cafeId}`, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error(error);
      await ctx.reply('Hata oluştu: ' + (error as Error).message);
    }
  }

  @Action(/^REJECT_/)
  async onRejectCafe(@Ctx() ctx: Context) {
    if (!this.isAdmin(ctx)) return;
    const callbackQuery = ctx.callbackQuery as any;
    const data = callbackQuery.data as string;
    const cafeId = data.replace('REJECT_', '');

    try {
      await this.telegramService.rejectCafe(cafeId);
      await ctx.answerCbQuery('İşletme reddedildi!');
      await ctx.editMessageText(`❌ İşletme reddedildi!\nID: ${cafeId}`, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error(error);
      await ctx.reply('Hata oluştu: ' + (error as Error).message);
    }
  }

  @Action(/^TARGET_/)
  async onTargetSelect(@Ctx() ctx: Context) {
    if (!this.isAdmin(ctx) || !ctx.from) return;
    // Fix for callback query data type
    const callbackQuery = ctx.callbackQuery as any;
    const data = callbackQuery.data as string;
    const userId = ctx.from.id;
    const session = this.telegramService.getSession(userId);

    if (session.state !== UserState.WAITING_FOR_TARGET) return;

    let target: EmailTarget | undefined;
    if (data === 'TARGET_ALL_OWNERS') target = EmailTarget.ALL_CAFE_OWNERS;
    else if (data === 'TARGET_ALL_USERS') target = EmailTarget.ALL_USERS;
    else if (data === 'TARGET_EVERYONE') target = EmailTarget.EVERYONE;
    else if (data === 'TARGET_SINGLE') target = EmailTarget.SINGLE_CAFE;

    if (!target) return;

    this.telegramService.updateSession(userId, {
      data: { ...session.data, target },
    });

    if (target === EmailTarget.SINGLE_CAFE) {
      const cafes = await this.telegramService.getAllCafes();

      if (cafes.length === 0) {
        await ctx.editMessageText('Hiç işletme bulunamadı.');
        return;
      }

      const buttons = cafes.map((cafe) => [
        Markup.button.callback(cafe.name, `CAFE_${cafe.id}`),
      ]);

      this.telegramService.updateSession(userId, {
        state: UserState.WAITING_FOR_CAFE_SELECTION,
      });

      await ctx.editMessageText(
        'Lütfen bir işletme seçin:',
        Markup.inlineKeyboard(buttons),
      );
    } else {
      this.telegramService.updateSession(userId, {
        state: UserState.WAITING_FOR_SUBJECT,
      });
      await ctx.editMessageText('Lütfen e-posta konusunu girin:');
    }
  }

  @Action(/^CAFE_/)
  async onCafeSelect(@Ctx() ctx: Context) {
    if (!this.isAdmin(ctx) || !ctx.from) return;
    const callbackQuery = ctx.callbackQuery as any;
    const data = callbackQuery.data as string;
    const userId = ctx.from.id;
    const session = this.telegramService.getSession(userId);

    if (session.state !== UserState.WAITING_FOR_CAFE_SELECTION) return;

    const cafeId = data.replace('CAFE_', '');
    const cafeName = await this.telegramService.getCafeName(cafeId);

    this.telegramService.updateSession(userId, {
      state: UserState.WAITING_FOR_SUBJECT,
      data: { ...session.data, cafeId, cafeName },
    });

    await ctx.editMessageText(
      `'${cafeName}' seçildi. Lütfen e-posta konusunu girin:`,
    );
  }

  @Action('CONFIRM_YES')
  async onConfirmYes(@Ctx() ctx: Context) {
    if (!this.isAdmin(ctx) || !ctx.from) return;
    const userId = ctx.from.id;
    const session = this.telegramService.getSession(userId);

    if (session.state !== UserState.CONFIRMATION) return;

    try {
      await ctx.editMessageText('E-posta gönderiliyor...');
      await this.telegramService.sendEmail(userId);
      await ctx.reply('✅ E-posta başarıyla gönderildi!');
    } catch (error) {
      console.error(error);
      await ctx.reply('❌ Bir hata oluştu: ' + (error as Error).message);
    } finally {
      this.telegramService.clearSession(userId);
    }
  }

  @Action('CONFIRM_NO')
  async onConfirmNo(@Ctx() ctx: Context) {
    if (!this.isAdmin(ctx) || !ctx.from) return;
    const userId = ctx.from.id;
    this.telegramService.clearSession(userId);
    await ctx.editMessageText('❌ İşlem iptal edildi.');
  }

  @Action('MAINTENANCE_ON')
  async onMaintenanceOn(@Ctx() ctx: Context) {
    if (!this.isAdmin(ctx)) return;
    try {
      await this.telegramService.updateSetting('maintenanceMode', 'true');
      await ctx.answerCbQuery('Bakım modu açıldı!');
      await ctx.editMessageText('🛠 Bakım Modu: ✅ AÇIK', {
        parse_mode: 'HTML',
      });
    } catch (error) {
      await ctx.reply('Hata: ' + (error as Error).message);
    }
  }

  @Action('MAINTENANCE_OFF')
  async onMaintenanceOff(@Ctx() ctx: Context) {
    if (!this.isAdmin(ctx)) return;
    try {
      await this.telegramService.updateSetting('maintenanceMode', 'false');
      await ctx.answerCbQuery('Bakım modu kapatıldı!');
      await ctx.editMessageText('🛠 Bakım Modu: ❌ KAPALI', {
        parse_mode: 'HTML',
      });
    } catch (error) {
      await ctx.reply('Hata: ' + (error as Error).message);
    }
  }

  private getTargetName(target: EmailTarget): string {
    switch (target) {
      case EmailTarget.ALL_CAFE_OWNERS:
        return 'Tüm Kafe Sahipleri';
      case EmailTarget.ALL_USERS:
        return 'Tüm Kullanıcılar';
      case EmailTarget.EVERYONE:
        return 'Herkes';
      case EmailTarget.SINGLE_CAFE:
        return 'Tek Bir İşletme';
      default:
        return target;
    }
  }

  private escapeHtml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
