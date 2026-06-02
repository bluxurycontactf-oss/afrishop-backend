import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

const STYLE = `<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;padding:20px}
  .wrap{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#1B4FD8,#7C3AED);padding:32px 28px;text-align:center;color:#fff}
  .header h1{font-size:24px;font-weight:800;margin-bottom:4px}
  .header p{font-size:14px;opacity:.85}
  .body{padding:28px}
  .title{font-size:18px;font-weight:700;color:#0F172A;margin-bottom:16px}
  .info-box{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin:14px 0}
  .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#374151}
  .row:last-child{border:none;font-weight:700;color:#0F172A}
  .row .label{color:#64748B}
  .step{display:flex;gap:12px;margin-bottom:12px;align-items:start}
  .step-num{width:28px;height:28px;border-radius:50%;background:#1B4FD8;color:#fff;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .step-text{font-size:14px;color:#374151;line-height:1.5}
  .phone-box{background:linear-gradient(135deg,#EFF6FF,#E0E7FF);border:1px solid #BFDBFE;border-radius:10px;padding:16px;text-align:center;margin:14px 0}
  .phone{font-size:22px;font-weight:900;color:#1B4FD8;letter-spacing:.02em}
  .badge{display:inline-block;background:#DCFCE7;color:#166534;font-size:12px;font-weight:700;padding:4px 12px;border-radius:100px;margin-bottom:12px}
  .footer{background:#F8FAFC;padding:20px 28px;text-align:center;color:#94A3B8;font-size:12px;border-top:1px solid #E2E8F0}
  .footer a{color:#1B4FD8;text-decoration:none}
</style>`;

const ADMIN_STYLE = `<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0F172A;padding:20px}
  .wrap{max-width:600px;margin:0 auto;background:#1E293B;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.3)}
  .header{background:linear-gradient(135deg,#F59E0B,#EF4444);padding:24px 28px;display:flex;align-items:center;justify-content:space-between}
  .header h1{font-size:20px;font-weight:800;color:#fff;margin:0}
  .new-badge{background:rgba(255,255,255,.2);color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:100px}
  .body{padding:24px 28px}
  .section-title{font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;margin-top:16px}
  .info-box{background:#0F172A;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:14px}
  .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:13px}
  .row:last-child{border:none}
  .row .label{color:#64748B}
  .row .val{color:#E2E8F0;font-weight:500;text-align:right;max-width:60%}
  .type-badge{display:inline-block;font-size:12px;font-weight:700;padding:4px 12px;border-radius:100px;background:rgba(27,79,216,.2);color:#93C5FD}
  .footer{padding:16px 28px;text-align:center;color:#475569;font-size:12px;border-top:1px solid rgba(255,255,255,.06)}
</style>`;

@Injectable()
export class ResiEmailService {
  private readonly logger = new Logger(ResiEmailService.name);

  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  private from = `ResiGo <${process.env.SMTP_USER}>`;
  private adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  private phone = process.env.RESI_PHONE || '+229 97 43 93 79';

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`[ResiEmail] Sent to ${to} — ${subject}`);
    } catch (e) {
      this.logger.error(`[ResiEmail] Error: ${e.message}`);
    }
  }

  private typeLabel(type: string): string {
    const labels: Record<string, string> = {
      STREAMING: '🎬 Streaming (Netflix/Prime)', IMMOBILIER: '🏠 Immobilier',
      VOLS: '✈️ Billets d\'avion', VOITURES: '🚗 Location voitures',
      LIVRAISON: '📦 Livraison', RESTAURATION: '🍽️ Restauration',
      SERVICES: '🔧 Services domicile', CONTACT: '💬 Contact', BILLET: '🎫 Billet événement',
    };
    return labels[type] || type;
  }

  private screenshotInfo(type: string): string {
    const info: Record<string, string> = {
      STREAMING: 'votre email du compte + mot de passe souhaité',
      VOLS: 'votre passeport ou CNI en photo',
      VOITURES: 'votre permis de conduire en photo',
      LIVRAISON: 'votre localisation GPS WhatsApp',
      RESTAURATION: 'votre adresse de livraison précise',
      SERVICES: 'photo du lieu ou du problème',
      BILLET: 'noms des participants + nombre de billets',
      IMMOBILIER: 'vos disponibilités pour une visite',
    };
    return info[type] || 'les informations nécessaires';
  }

  // ── Email client : confirmation de commande ─────────────────
  async sendClientConfirmation(req: {
    name: string; email: string; type: string;
    subject?: string; message?: string; data?: any;
  }) {
    if (!req.email) return;

    const typeLabel = this.typeLabel(req.type);
    const screenshot = this.screenshotInfo(req.type);
    const fields = req.data
      ? Object.entries(req.data)
          .filter(([k]) => !['payment'].includes(k))
          .map(([k, v]) => `<div class="row"><span class="label">${k}</span><span>${v}</span></div>`)
          .join('')
      : '';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${STYLE}</head><body>
      <div class="wrap">
        <div class="header">
          <h1>ResiGo</h1>
          <p>Votre demande a bien été reçue ✅</p>
        </div>
        <div class="body">
          <span class="badge">✅ Demande enregistrée</span>
          <div class="title">Bonjour ${req.name} !</div>
          <p style="font-size:14px;color:#475569;line-height:1.7;margin-bottom:16px">
            Nous avons bien reçu votre demande pour <strong>${typeLabel}</strong>
            ${req.subject ? ' — <strong>' + req.subject + '</strong>' : ''}.
            Notre équipe vous contactera dans les <strong>2 heures</strong> pour finaliser.
          </p>
          ${fields ? `<div class="info-box">
            <div style="font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Récapitulatif</div>
            ${fields}
          </div>` : ''}
          <div style="margin:20px 0">
            <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:12px">📋 Prochaines étapes :</div>
            <div class="step">
              <div class="step-num">1</div>
              <div class="step-text">Envoyez votre paiement par <strong>MTN MoMo</strong> ou <strong>Moov Money</strong> au numéro ci-dessous</div>
            </div>
            <div class="phone-box">
              <div style="font-size:12px;color:#64748B;margin-bottom:4px">Numéro de dépôt</div>
              <div class="phone">${this.phone}</div>
              <div style="font-size:12px;color:#64748B;margin-top:4px">Nom du compte : <strong>ResiGo</strong></div>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <div class="step-text">Envoyez sur WhatsApp au <strong>${this.phone}</strong> : la <strong>capture d'écran du paiement</strong> + <strong>${screenshot}</strong></div>
            </div>
            <div class="step">
              <div class="step-num">3</div>
              <div class="step-text">Notre équipe confirme et traite votre demande <strong>sous 2 heures</strong> ⚡</div>
            </div>
          </div>
          <p style="font-size:13px;color:#94A3B8;margin-top:16px">
            Des questions ? Contactez-nous sur WhatsApp : <a href="https://wa.me/${this.phone.replace(/\s|\+/g,'')}" style="color:#1B4FD8;font-weight:600">${this.phone}</a>
          </p>
        </div>
        <div class="footer">
          © 2025 ResiGo · Cotonou, Bénin<br>
          <a href="https://resigroup.web.app">resigroup.web.app</a>
        </div>
      </div>
    </body></html>`;

    await this.send(req.email, `✅ Demande reçue — ${typeLabel} | ResiGo`, html);
  }

  // ── Email admin : nouvelle demande ──────────────────────────
  async sendAdminNotification(req: {
    name: string; email?: string; phone: string;
    type: string; subject?: string; message?: string; data?: any;
  }) {
    const typeLabel = this.typeLabel(req.type);
    const now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Porto-Novo' });

    const fields = req.data
      ? Object.entries(req.data)
          .map(([k, v]) => `<div class="row"><span class="label">${k}</span><span class="val">${v}</span></div>`)
          .join('')
      : '';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${ADMIN_STYLE}</head><body>
      <div class="wrap">
        <div class="header">
          <h1>🔔 Nouvelle demande</h1>
          <span class="new-badge">NOUVEAU</span>
        </div>
        <div class="body">
          <div style="margin-bottom:16px">
            <span class="type-badge">${typeLabel}</span>
            ${req.subject ? `<div style="font-size:16px;font-weight:700;color:white;margin-top:8px">${req.subject}</div>` : ''}
            <div style="font-size:12px;color:#475569;margin-top:4px">Reçu le ${now}</div>
          </div>
          <div class="section-title">Client</div>
          <div class="info-box">
            <div class="row"><span class="label">Nom</span><span class="val">${req.name}</span></div>
            <div class="row"><span class="label">Téléphone</span><span class="val">${req.phone}</span></div>
            ${req.email ? `<div class="row"><span class="label">Email</span><span class="val">${req.email}</span></div>` : ''}
          </div>
          ${fields ? `<div class="section-title">Détails de la demande</div>
          <div class="info-box">${fields}</div>` : ''}
          ${req.message ? `<div class="section-title">Message</div>
          <div class="info-box"><div style="font-size:13px;color:#E2E8F0">${req.message}</div></div>` : ''}
          <div style="margin-top:20px;padding:14px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);border-radius:10px;text-align:center">
            <div style="font-size:13px;color:#FCD34D;font-weight:600">Répondre sur WhatsApp</div>
            <div style="font-size:20px;font-weight:900;color:#F59E0B;margin:6px 0">${req.phone}</div>
            <a href="https://wa.me/${req.phone.replace(/\s|\+/g,'')}"
               style="display:inline-block;background:linear-gradient(135deg,#F59E0B,#EF4444);color:white;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;margin-top:8px">
              💬 Ouvrir WhatsApp →
            </a>
          </div>
        </div>
        <div class="footer">
          ResiGo Admin · <a href="https://resigroup.web.app/admin.html" style="color:#60A5FA">Ouvrir l'admin →</a>
        </div>
      </div>
    </body></html>`;

    await this.send(
      this.adminEmail,
      `🔔 Nouvelle demande ${typeLabel} — ${req.name} | ResiGo`,
      html,
    );
  }

  // ── Email client : statut traité ────────────────────────────
  async sendStatusUpdate(req: {
    name: string; email: string; type: string;
    subject?: string; status: string;
  }) {
    if (!req.email || req.status !== 'DONE') return;
    const typeLabel = this.typeLabel(req.type);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${STYLE}</head><body>
      <div class="wrap">
        <div class="header" style="background:linear-gradient(135deg,#10B981,#059669)">
          <h1>ResiGo</h1>
          <p>Votre demande a été traitée ✅</p>
        </div>
        <div class="body">
          <span class="badge" style="background:#DCFCE7;color:#166534">✅ Traité avec succès</span>
          <div class="title" style="margin-top:12px">Bonjour ${req.name} !</div>
          <p style="font-size:14px;color:#475569;line-height:1.7;margin:12px 0">
            Votre demande pour <strong>${typeLabel}</strong>
            ${req.subject ? ' — <strong>' + req.subject + '</strong>' : ''}
            a été traitée avec succès. 🎉
          </p>
          <p style="font-size:14px;color:#475569;line-height:1.7">
            Merci de votre confiance. N'hésitez pas à revenir sur
            <a href="https://resigroup.web.app" style="color:#1B4FD8;font-weight:600">resigroup.web.app</a>
            pour découvrir tous nos services.
          </p>
        </div>
        <div class="footer">
          © 2025 ResiGo · Cotonou, Bénin ·
          <a href="https://resigroup.web.app">resigroup.web.app</a>
        </div>
      </div>
    </body></html>`;
    await this.send(req.email, `✅ Demande traitée — ${typeLabel} | ResiGo`, html);
  }
}
