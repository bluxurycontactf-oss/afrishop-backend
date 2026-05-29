import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

const BASE_STYLE = `
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:0}
    .container{max-width:520px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    .header{background:linear-gradient(135deg,#f97316,#ea580c);padding:28px;text-align:center;color:#fff}
    .header h1{margin:0;font-size:22px;font-weight:800}
    .header p{margin:6px 0 0;opacity:.85;font-size:14px}
    .body{padding:24px}
    .info-box{background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0}
    .info-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb;font-size:14px}
    .info-row:last-child{border:none;font-weight:700}
    .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700}
    .btn{display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;margin:16px 0}
    .footer{text-align:center;padding:16px;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb}
    .gc-card{background:linear-gradient(135deg,#1e3a5f,#0f172a);border-radius:12px;padding:24px;text-align:center;color:#fff;margin:16px 0}
    .gc-code{font-family:monospace;font-size:22px;font-weight:900;letter-spacing:3px;color:#f97316;margin:12px 0;background:rgba(255,255,255,.1);padding:10px 20px;border-radius:8px;display:inline-block}
  </style>
`;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  private from = () => `AfriShop Boutique <${process.env.SMTP_USER}>`;

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({ from: this.from(), to, subject, html });
      this.logger.log(`Email envoyé à ${to} — ${subject}`);
    } catch (e) {
      this.logger.error(`Email error: ${e.message}`);
    }
  }

  // ── Confirmation commande ───────────────────────────────────
  async sendOrderConfirmation(email: string, orderNumber: string, total: number) {
    if (!email) return;
    await this.send(email, `✅ Commande confirmée #${orderNumber} — AfriShop`, `
      ${BASE_STYLE}
      <div class="container">
        <div class="header"><h1>🛍️ AfriShop</h1><p>Commande confirmée !</p></div>
        <div class="body">
          <p style="font-size:15px;color:#374151">Merci pour votre commande ! Nous l'avons bien reçue et elle est en cours de traitement.</p>
          <div class="info-box">
            <div class="info-row"><span>Référence</span><span><strong>${orderNumber}</strong></span></div>
            <div class="info-row"><span>Total</span><span><strong>${total.toLocaleString()} XOF</strong></span></div>
            <div class="info-row"><span>Statut</span><span><span class="badge" style="background:#dcfce7;color:#166534">✅ Payé</span></span></div>
          </div>
          <p style="font-size:13px;color:#6b7280">Délai de livraison : 7 à 21 jours. Vous recevrez une notification dès l'expédition.</p>
        </div>
        <div class="footer">AfriShop · La boutique africaine</div>
      </div>
    `);
  }

  // ── Notification statut commande ────────────────────────────
  async sendOrderStatusUpdate(email: string, orderNumber: string, status: string, trackingNumber?: string) {
    if (!email) return;
    const statusMap: Record<string, { label: string; icon: string; color: string; bg: string; msg: string }> = {
      PROCESSING: { label: 'En traitement', icon: '⚙️', color: '#92400e', bg: '#fef3c7', msg: 'Votre commande est en cours de préparation chez le fournisseur.' },
      SHIPPED:    { label: 'Expédiée', icon: '✈️', color: '#1d4ed8', bg: '#eff6ff', msg: 'Votre colis est en route ! Il arrivera dans 7 à 14 jours.' },
      DELIVERED:  { label: 'Livrée', icon: '🏠', color: '#166534', bg: '#f0fdf4', msg: 'Votre commande a été livrée. Merci de votre confiance !' },
      CANCELLED:  { label: 'Annulée', icon: '❌', color: '#991b1b', bg: '#fef2f2', msg: 'Votre commande a été annulée. Contactez-nous pour plus d\'informations.' },
    };
    const info = statusMap[status];
    if (!info) return;
    const trackingHtml = trackingNumber
      ? `<div class="info-box" style="margin-top:12px"><div class="info-row"><span>Numéro de suivi</span><span><strong style="font-family:monospace">${trackingNumber}</strong></span></div></div>`
      : '';
    await this.send(email, `${info.icon} Commande ${info.label} #${orderNumber} — AfriShop`, `
      ${BASE_STYLE}
      <div class="container">
        <div class="header"><h1>🛍️ AfriShop</h1><p>Mise à jour de votre commande</p></div>
        <div class="body">
          <div style="text-align:center;margin-bottom:16px">
            <span class="badge" style="background:${info.bg};color:${info.color};font-size:16px;padding:8px 20px">${info.icon} ${info.label}</span>
          </div>
          <p style="font-size:15px;color:#374151;text-align:center">${info.msg}</p>
          <div class="info-box">
            <div class="info-row"><span>Référence commande</span><span><strong>${orderNumber}</strong></span></div>
          </div>
          ${trackingHtml}
          <div style="text-align:center"><a href="https://afrishop.web.app/orders.html" class="btn">📦 Voir ma commande</a></div>
        </div>
        <div class="footer">AfriShop · La boutique africaine · <a href="https://afrishop.web.app">afrishop.web.app</a></div>
      </div>
    `);
  }

  // ── Envoi code carte cadeau ─────────────────────────────────
  async sendGiftCard(email: string, code: string, amount: number, note?: string) {
    if (!email) return;
    await this.send(email, `🎁 Votre carte cadeau AfriShop de ${amount.toLocaleString()} XOF`, `
      ${BASE_STYLE}
      <div class="container">
        <div class="header"><h1>🎁 Carte Cadeau AfriShop</h1><p>Un cadeau vous a été offert !</p></div>
        <div class="body">
          ${note ? `<p style="font-size:15px;color:#374151;text-align:center;font-style:italic">"${note}"</p>` : ''}
          <div class="gc-card">
            <div style="font-size:13px;color:rgba(255,255,255,.6);letter-spacing:1px">CARTE CADEAU</div>
            <div style="font-size:32px;font-weight:900;color:#f97316;margin:8px 0">${amount.toLocaleString()} XOF</div>
            <div style="font-size:13px;color:rgba(255,255,255,.7);margin-bottom:8px">Votre code :</div>
            <div class="gc-code">${code}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:10px">✓ Valable sur tous les produits · Sans date d'expiration</div>
          </div>
          <div style="text-align:center">
            <a href="https://afrishop.web.app" class="btn">🛍️ Utiliser maintenant</a>
          </div>
          <div class="info-box" style="margin-top:16px">
            <p style="font-size:13px;color:#6b7280;margin:0"><strong>Comment utiliser votre carte :</strong><br>1. Visitez afrishop.web.app<br>2. Ajoutez des produits au panier<br>3. Au paiement, entrez le code ci-dessus<br>4. Le montant est déduit automatiquement</p>
          </div>
        </div>
        <div class="footer">AfriShop · La boutique africaine · <a href="https://afrishop.web.app/gift-card.html">Vérifier mon solde</a></div>
      </div>
    `);
  }

  // ── Confirmation retrait ────────────────────────────────────
  async sendWithdrawalConfirmation(email: string, dto: { amount: number; fee: number; net: number; operator: string; momoNumber: string }) {
    if (!email) return;
    await this.send(email, `💸 Demande de retrait reçue — AfriShop Portefeuille`, `
      ${BASE_STYLE}
      <div class="container">
        <div class="header" style="background:linear-gradient(135deg,#1d4ed8,#2563eb)">
          <h1>💸 Demande de retrait</h1>
          <p>Votre demande a bien été enregistrée</p>
        </div>
        <div class="body">
          <p style="font-size:15px;color:#374151">Votre demande de retrait a été reçue et sera traitée sous <strong>48 heures</strong>.</p>
          <div class="info-box">
            <div class="info-row"><span>Montant demandé</span><span><strong>${dto.amount.toLocaleString()} XOF</strong></span></div>
            <div class="info-row"><span>Frais AfriShop</span><span style="color:#dc2626">- ${dto.fee.toLocaleString()} XOF</span></div>
            <div class="info-row"><span>Vous recevrez</span><span><strong style="color:#16a34a">${dto.net.toLocaleString()} XOF</strong></span></div>
            <div class="info-row"><span>Opérateur</span><span>${dto.operator}</span></div>
            <div class="info-row"><span>Numéro de réception</span><span><strong>${dto.momoNumber}</strong></span></div>
          </div>
          <div style="background:#eff6ff;border-radius:8px;padding:14px;margin-top:8px">
            <p style="font-size:13px;color:#1d4ed8;margin:0"><strong>⏰ Délai de traitement :</strong> Votre retrait sera effectué dans les <strong>48 heures</strong> suivant cette demande.<br><br>En cas de problème, contactez notre support depuis la boutique.</p>
          </div>
          <div style="text-align:center;margin-top:16px">
            <a href="https://afrishop.web.app/wallet.html" class="btn">👛 Voir mon portefeuille</a>
          </div>
        </div>
        <div class="footer">AfriShop Boutique · <a href="https://afrishop.web.app">afrishop.web.app</a></div>
      </div>
    `);
  }

  // ── Première utilisation carte cadeau ──────────────────────
  async sendGiftCardFirstUse(email: string, code: string, remaining: number, expiresAt: Date) {
    const expStr = expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    await this.send(email, `⏰ Votre carte cadeau expire le ${expStr} — AfriShop`, `
      ${BASE_STYLE}
      <div class="container">
        <div class="header" style="background:linear-gradient(135deg,#92400e,#b45309)">
          <h1>⏰ Rappel important</h1>
          <p>Votre carte cadeau a été utilisée</p>
        </div>
        <div class="body">
          <p style="font-size:15px;color:#374151">Vous avez utilisé votre carte cadeau pour la première fois. Il vous reste <strong>${remaining.toLocaleString()} XOF</strong> à utiliser.</p>
          <div class="info-box" style="border-left:4px solid #f97316">
            <div class="info-row"><span>Solde restant</span><span style="font-weight:800;color:#f97316">${remaining.toLocaleString()} XOF</span></div>
            <div class="info-row"><span>Code</span><span style="font-family:monospace;font-weight:700">${code}</span></div>
            <div class="info-row"><span>⚠️ Expire le</span><span style="font-weight:800;color:#dc2626">${expStr}</span></div>
          </div>
          <div style="background:#fef3c7;border-radius:8px;padding:14px;font-size:13px;color:#92400e">
            <strong>Important :</strong> Vous avez <strong>14 jours</strong> pour utiliser votre solde restant. Après cette date, le solde sera automatiquement transféré vers votre portefeuille AfriShop (si vous avez un numéro de téléphone enregistré).
          </div>
          <div style="text-align:center;margin-top:16px">
            <a href="https://afrishop.web.app" class="btn">🛍️ Utiliser maintenant</a>
          </div>
        </div>
        <div class="footer">AfriShop Boutique · <a href="https://afrishop.web.app/gift-card.html">Vérifier mon solde</a></div>
      </div>
    `);
  }

  // ── Expiration carte cadeau ──────────────────────────────────
  async sendGiftCardExpired(email: string, code: string, balance: number, walletTransferred: boolean) {
    await this.send(email, `🔔 Carte cadeau expirée — Solde ${walletTransferred ? 'transféré' : 'perdu'} — AfriShop`, `
      ${BASE_STYLE}
      <div class="container">
        <div class="header" style="background:linear-gradient(135deg,#1d4ed8,#2563eb)">
          <h1>${walletTransferred ? '👛 Solde transféré !' : '⚠️ Carte expirée'}</h1>
          <p>Votre carte cadeau a expiré</p>
        </div>
        <div class="body">
          <div class="info-box">
            <div class="info-row"><span>Code</span><span style="font-family:monospace;font-weight:700">${code}</span></div>
            <div class="info-row"><span>Solde expiré</span><span style="font-weight:800">${balance.toLocaleString()} XOF</span></div>
          </div>
          ${walletTransferred
            ? `<div style="background:#eff6ff;border-radius:8px;padding:14px;font-size:14px;color:#1d4ed8">
                ✅ <strong>Bonne nouvelle !</strong> Votre solde de <strong>${balance.toLocaleString()} XOF</strong> a été automatiquement transféré vers votre portefeuille AfriShop. Vous pouvez l'utiliser pour vos prochaines commandes.
                <div style="text-align:center;margin-top:12px"><a href="https://afrishop.web.app/wallet.html" class="btn">👛 Voir mon portefeuille</a></div>
              </div>`
            : `<div style="background:#fef2f2;border-radius:8px;padding:14px;font-size:13px;color:#991b1b">
                Le solde de votre carte a expiré. Pour éviter cela à l'avenir, enregistrez votre numéro de téléphone lors de l'utilisation de vos cartes cadeaux.
              </div>`
          }
        </div>
        <div class="footer">AfriShop Boutique · <a href="https://afrishop.web.app">afrishop.web.app</a></div>
      </div>
    `);
  }

  // ── Message support ─────────────────────────────────────────
  async sendContactMessage(dto: { name: string; contact: string; message: string }) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    await this.send(adminEmail, `💬 Nouveau message de ${dto.name} — AfriShop Support`, `
      ${BASE_STYLE}
      <div class="container">
        <div class="header" style="background:linear-gradient(135deg,#0f172a,#1e3a5f)"><h1>💬 Nouveau message client</h1></div>
        <div class="body">
          <div class="info-box">
            <div class="info-row"><span>Nom</span><span><strong>${dto.name}</strong></span></div>
            <div class="info-row"><span>Contact</span><span>${dto.contact || '—'}</span></div>
            <div class="info-row"><span>Date</span><span>${new Date().toLocaleString('fr-FR')}</span></div>
          </div>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;font-size:14px;color:#374151;line-height:1.6">${dto.message}</div>
        </div>
        <div class="footer">AfriShop Admin · <a href="https://afrishop.web.app/gestion-2ibb7or6.html">Ouvrir l'admin</a></div>
      </div>
    `);
  }
}
