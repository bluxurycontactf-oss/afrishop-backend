"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor() {
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT) || 587,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    }
    async sendOrderConfirmation(email, orderNumber, total) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || 'AfriShop <noreply@afrishop.com>',
                to: email,
                subject: `✅ Commande confirmée #${orderNumber}`,
                html: `<h2>Merci pour votre commande !</h2><p>Votre commande <strong>#${orderNumber}</strong> d'un montant de <strong>${total.toLocaleString()} XOF</strong> a été reçue.</p>`,
            });
        }
        catch (e) {
            this.logger.error(`Email error: ${e.message}`);
        }
    }
    async sendShippingNotification(email, orderNumber, trackingNumber) {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: `📦 Votre colis est en route ! #${orderNumber}`,
                html: `<h2>Votre commande est expédiée !</h2><p>Numéro de suivi : <strong>${trackingNumber}</strong></p>`,
            });
        }
        catch (e) {
            this.logger.error(`Email error: ${e.message}`);
        }
    }
    async sendContactMessage(dto) {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        try {
            await this.transporter.sendMail({
                from: `AfriShop Support <${process.env.SMTP_USER}>`,
                to: adminEmail,
                subject: `💬 Nouveau message de ${dto.name} — AfriShop Support`,
                html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
            <h2 style="color:#f97316">💬 Nouveau message client</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;background:#f9fafb;font-weight:600">Nom</td><td style="padding:8px">${dto.name}</td></tr>
              <tr><td style="padding:8px;background:#f9fafb;font-weight:600">Contact</td><td style="padding:8px">${dto.contact || '—'}</td></tr>
              <tr><td style="padding:8px;background:#f9fafb;font-weight:600">Message</td><td style="padding:8px">${dto.message}</td></tr>
              <tr><td style="padding:8px;background:#f9fafb;font-weight:600">Date</td><td style="padding:8px">${new Date().toLocaleString('fr-FR')}</td></tr>
            </table>
            <p style="margin-top:20px;color:#6b7280;font-size:13px">Ce message a été envoyé depuis le support de la boutique AfriShop.</p>
          </div>
        `,
            });
            this.logger.log(`Support email envoyé à ${adminEmail}`);
        }
        catch (e) {
            this.logger.error(`Support email error: ${e.message}`);
            throw e;
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map