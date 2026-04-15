import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';
import { formatCurrencyAmount } from '../user/currency.constants';

type ReminderEmailParams = {
  to: string;
  transactionName: string;
  amount: number;
  dueDate: string;
  currency: string;
  unsubscribeToken: string;
};

type DigestEmailParams = {
  to: string;
  digestDate: string;
  currency: string;
  items: Array<{
    transactionName: string;
    amount: number;
    dueDate: string;
  }>;
  unsubscribeToken: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: Resend | null;
  private readonly fromAddress: string;
  private readonly appUrl: string;
  private readonly unsubscribeSecret: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.client = apiKey ? new Resend(apiKey) : null;
    this.fromAddress =
      this.configService.get<string>('EMAIL_FROM') ??
      'BudgetWise <reminders@budgetwise.app>';
    this.appUrl = this.normalizeAppUrl(
      this.configService.get<string>('ORIGIN') ?? 'http://localhost:4200',
    );
    this.unsubscribeSecret =
      this.configService.get<string>('EMAIL_UNSUBSCRIBE_SECRET') ??
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ??
      'budgetwise-email-unsubscribe';

    if (!this.client) {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Email reminders are disabled.',
      );
    }
  }

  createUnsubscribeToken(userId: string): string {
    const payload = JSON.stringify({
      userId,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });
    const encodedPayload = Buffer.from(payload).toString('base64url');
    const signature = this.sign(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  verifyUnsubscribeToken(token: string): string {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      throw new BadRequestException('Invalid unsubscribe token.');
    }

    const expectedSignature = this.sign(encodedPayload);
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new BadRequestException('Invalid unsubscribe token.');
    }

    let payload: { userId?: string; exp?: number };

    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as { userId?: string; exp?: number };
    } catch {
      throw new BadRequestException('Invalid unsubscribe token.');
    }

    if (!payload.userId || !payload.exp || payload.exp < Date.now()) {
      throw new BadRequestException('This unsubscribe link has expired.');
    }

    return payload.userId;
  }

  async sendScheduledTransactionReminder(
    params: ReminderEmailParams,
  ): Promise<void> {
    if (!this.client) {
      return;
    }

    const subject = `Reminder: ${params.transactionName} due ${params.dueDate}`;
    const amount = formatCurrencyAmount(params.amount, params.currency);
    const appLink = this.buildAppLink('/scheduled-transactions');
    const unsubscribeLink = this.buildAppLink(
      `/email-preferences/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`,
    );

    await this.client.emails.send({
      from: this.fromAddress,
      to: params.to,
      subject,
      html: this.wrapEmailHtml({
        eyebrow: 'Scheduled transaction reminder',
        title: params.transactionName,
        body: `You have an upcoming scheduled transaction due on ${params.dueDate}.`,
        details: [
          { label: 'Amount', value: amount },
          { label: 'Due date', value: params.dueDate },
        ],
        ctaLabel: 'Open BudgetWise',
        ctaHref: appLink,
        unsubscribeLink,
      }),
      text: [
        `BudgetWise reminder: ${params.transactionName}`,
        `Amount: ${amount}`,
        `Due date: ${params.dueDate}`,
        `Open BudgetWise: ${appLink}`,
        `Unsubscribe: ${unsubscribeLink}`,
      ].join('\n'),
    });
  }

  async sendDailyDigest(params: DigestEmailParams): Promise<void> {
    if (!this.client || params.items.length === 0) {
      return;
    }

    const appLink = this.buildAppLink('/scheduled-transactions');
    const unsubscribeLink = this.buildAppLink(
      `/email-preferences/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`,
    );

    await this.client.emails.send({
      from: this.fromAddress,
      to: params.to,
      subject: `BudgetWise daily reminders for ${params.digestDate}`,
      html: this.wrapEmailHtml({
        eyebrow: 'Daily reminder digest',
        title: `You have ${params.items.length} scheduled reminder${params.items.length === 1 ? '' : 's'} today`,
        body: `Here is your BudgetWise summary for ${params.digestDate}.`,
        details: params.items.map((item) => ({
          label: item.transactionName,
          value: `${formatCurrencyAmount(item.amount, params.currency)} due ${item.dueDate}`,
        })),
        ctaLabel: 'Review scheduled transactions',
        ctaHref: appLink,
        unsubscribeLink,
      }),
      text: [
        `BudgetWise daily digest for ${params.digestDate}`,
        ...params.items.map(
          (item) =>
            `- ${item.transactionName}: ${formatCurrencyAmount(item.amount, params.currency)} due ${item.dueDate}`,
        ),
        `Open BudgetWise: ${appLink}`,
        `Unsubscribe: ${unsubscribeLink}`,
      ].join('\n'),
    });
  }

  private normalizeAppUrl(value: string): string {
    return value.endsWith('/') ? value.slice(0, -1) : value;
  }

  private buildAppLink(path: string): string {
    return new URL(path, `${this.appUrl}/`).toString();
  }

  private sign(encodedPayload: string): string {
    return createHmac('sha256', this.unsubscribeSecret)
      .update(encodedPayload)
      .digest('base64url');
  }

  private wrapEmailHtml(params: {
    eyebrow: string;
    title: string;
    body: string;
    details: Array<{ label: string; value: string }>;
    ctaLabel: string;
    ctaHref: string;
    unsubscribeLink: string;
  }): string {
    const detailsHtml = params.details
      .map(
        (detail) =>
          `<tr><td style="padding:8px 0;color:#5f6b7a;font-size:14px;">${this.escapeHtml(detail.label)}</td><td style="padding:8px 0;color:#132238;font-size:14px;font-weight:600;text-align:right;">${this.escapeHtml(detail.value)}</td></tr>`,
      )
      .join('');

    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 0;font-family:Arial,sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;padding:32px;">
              <tr>
                <td style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#5f6b7a;padding-bottom:12px;">
                  ${this.escapeHtml(params.eyebrow)}
                </td>
              </tr>
              <tr>
                <td style="font-size:28px;line-height:1.2;color:#132238;font-weight:700;padding-bottom:12px;">
                  ${this.escapeHtml(params.title)}
                </td>
              </tr>
              <tr>
                <td style="font-size:15px;line-height:1.6;color:#465365;padding-bottom:20px;">
                  ${this.escapeHtml(params.body)}
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    ${detailsHtml}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:24px;">
                  <a href="${params.ctaHref}" style="display:inline-block;background:#132238;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:600;">
                    ${this.escapeHtml(params.ctaLabel)}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="font-size:13px;line-height:1.6;color:#5f6b7a;border-top:1px solid #e3e8ef;padding-top:20px;">
                  You are receiving this because email reminders are enabled in BudgetWise.
                  <a href="${params.unsubscribeLink}" style="color:#132238;">Unsubscribe from reminder emails</a>.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
