import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  async sendOrderConfirmation(email: string, orderNumber: string, total: number) {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'AfriShop <noreply@afrishop.com>',
        to: email,
        subject: `✅ Commande confirmée #${orderNumber}`,
        html: `<h2>Merci pour votre commande !</h2><p>Votre commande <strong>#${orderNumber}</strong> d'un montant de <strong>${total.toLocaleString()} XOF</strong> a été reçue.</p>`,
      });
    } catch (e) { this.logger.error(`Email error: ${e.message}`); }
  }

  async sendShippingNotification(email: string, orderNumber: string, trackingNumber: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `📦 Votre colis est en route ! #${orderNumber}`,
        html: `<h2>Votre commande est expédiée !</h2><p>Numéro de suivi : <strong>${trackingNumber}</strong></p>`,
      });
    } catch (e) { this.logger.error(`Email error: ${e.message}`); }
  }
}
