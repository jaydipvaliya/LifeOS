import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface EmailMessagePayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface IEmailService {
  readonly providerName: string;
  sendEmail(message: EmailMessagePayload): Promise<{ delivered: boolean; messageId?: string }>;
}

export class LoggedEmailService implements IEmailService {
  readonly providerName = 'logged-dev';

  async sendEmail(
    message: EmailMessagePayload,
  ): Promise<{ delivered: boolean; messageId?: string }> {
    logger.info(
      {
        provider: this.providerName,
        to: message.to,
        subject: message.subject,
      },
      'Email logged locally (configure EMAIL_PROVIDER=resend for live delivery)',
    );
    return { delivered: false, messageId: `local-${Date.now()}` };
  }
}

export class ResendEmailService implements IEmailService {
  readonly providerName = 'resend';

  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string,
  ) {}

  async sendEmail(
    message: EmailMessagePayload,
  ): Promise<{ delivered: boolean; messageId?: string }> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logger.warn(
        { status: response.status, errorText },
        'Resend email delivery returned non-2xx status',
      );
      return { delivered: false };
    }

    const payload = (await response.json()) as { id?: string };
    return { delivered: true, messageId: payload.id };
  }
}

export function createEmailService(): IEmailService {
  if (env.NODE_ENV !== 'test' && env.EMAIL_PROVIDER === 'resend' && env.EMAIL_API_KEY) {
    return new ResendEmailService(env.EMAIL_API_KEY, env.EMAIL_FROM);
  }
  return new LoggedEmailService();
}
