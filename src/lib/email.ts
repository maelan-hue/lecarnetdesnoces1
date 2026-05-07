import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function sendNewMessageEmail(opts: {
  to: string;
  recipientName: string;
  senderName: string;
  messageBody: string;
  conversationUrl: string;
}) {
  const bodyHtml = opts.messageBody
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  return resend.emails.send({
    from: FROM,
    to:   opts.to,
    subject: `Nouveau message de ${opts.senderName} — Le Carnet des noces`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#FAF8F4;padding:0;">

        <div style="background:#1A1510;padding:24px 32px;">
          <p style="margin:0;font-family:'Georgia',serif;font-size:18px;color:#FAF8F4;letter-spacing:0.04em;">
            Le Carnet <em style="color:#A8833B;">des noces</em>
          </p>
        </div>

        <div style="padding:32px;">
          <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#A8833B;font-family:'Jost',sans-serif;">
            Nouveau message
          </p>
          <h2 style="margin:0 0 24px;font-size:22px;font-weight:300;color:#1A1510;">
            ${opts.senderName} vous a écrit
          </h2>

          <div style="background:#F2ECE1;border-left:3px solid #A8833B;padding:20px 24px;margin-bottom:28px;">
            <p style="margin:0;font-size:15px;line-height:1.7;color:#1A1510;white-space:pre-wrap;">${bodyHtml}</p>
          </div>

          <a href="${opts.conversationUrl}"
             style="display:inline-block;background:#A8833B;color:#FAF8F4;padding:14px 28px;text-decoration:none;font-family:'Jost',sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
            Répondre depuis mon espace →
          </a>

          <div style="margin-top:24px;padding:16px;background:#E8DFD0;border-radius:0;">
            <p style="margin:0;font-size:12px;color:#7D7060;font-style:italic;line-height:1.6;">
              ℹ️ Pour répondre à ce message, connectez-vous à votre espace personnel sur Le Carnet des noces.
              Il n'est pas possible de répondre directement à cet email.
            </p>
          </div>
        </div>

        <div style="padding:16px 32px;border-top:1px solid #D4C9B3;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8A7B63;">
            Le Carnet des noces · Perpignan &amp; Roussillon
          </p>
        </div>

      </div>
    `,
  });
}

export async function sendPaymentLinkEmail(opts: {
  to: string;
  coupleName: string;
  proName: string;
  label: string;
  amount: string;
  paymentUrl: string;
  message?: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Demande de paiement de ${opts.proName} — Le Carnet des noces`,
    html: `
      <p>Bonjour ${opts.coupleName},</p>
      ${opts.message ? `<p>${opts.message.replace(/\n/g, "<br/>")}</p>` : ""}
      <p>Montant : <strong>${opts.amount}</strong> — ${opts.label}</p>
      <p><a href="${opts.paymentUrl}" style="background:#A8833B;color:#FAF8F4;padding:12px 24px;text-decoration:none;display:inline-block;">
        Régler maintenant
      </a></p>
      <p style="font-size:12px;color:#8A7B63;">Paiement sécurisé par Stripe · 3D Secure</p>
      <hr/>
      <p style="font-size:12px;color:#8A7B63;">Le Carnet des noces · Perpignan &amp; Roussillon</p>
    `,
  });
}

export async function sendCredentialsEmail(opts: {
  to: string;
  name: string;
  password: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Votre compte Le Carnet des noces est activé`,
    html: `
      <p>Bonjour ${opts.name},</p>
      <p>Votre compte prestataire sur Le Carnet des noces a été validé.</p>
      <p><strong>Email :</strong> ${opts.to}<br/>
      <strong>Mot de passe temporaire :</strong> ${opts.password}</p>
      <p><a href="${APP_URL}/connexion-pro" style="color:#A8833B;">Accéder à mon espace</a></p>
      <p>Pensez à changer votre mot de passe après votre première connexion.</p>
      <hr/>
      <p style="font-size:12px;color:#8A7B63;">Le Carnet des noces · Perpignan &amp; Roussillon</p>
    `,
  });
}

export async function sendPaymentReceiptEmail(opts: {
  to: string;
  coupleName: string;
  proName: string;
  label: string;
  amount: string;
  reference: string;
  dashboardUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to:   opts.to,
    subject: `Paiement confirmé — ${opts.label}`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#FAF8F4;">
        <div style="background:#1A1510;padding:24px 32px;">
          <p style="margin:0;font-size:18px;color:#FAF8F4;">Le Carnet <em style="color:#A8833B;">des noces</em></p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#7A8B6E;">Paiement confirmé ✓</p>
          <h2 style="margin:0 0 24px;font-size:22px;font-weight:300;color:#1A1510;">Merci, ${opts.coupleName}.</h2>
          <div style="background:#F2ECE1;border:1px solid #D4C9B3;padding:20px 24px;margin-bottom:28px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:8px 0;color:#7D7060;border-bottom:1px dashed #D4C9B3;">Prestataire</td><td style="text-align:right;font-family:'Georgia',serif;">${opts.proName}</td></tr>
              <tr><td style="padding:8px 0;color:#7D7060;border-bottom:1px dashed #D4C9B3;">Prestation</td><td style="text-align:right;">${opts.label}</td></tr>
              <tr><td style="padding:8px 0;color:#7D7060;border-bottom:1px dashed #D4C9B3;">Référence</td><td style="text-align:right;font-family:monospace;">#${opts.reference}</td></tr>
              <tr><td style="padding:10px 0 0;font-weight:500;font-size:15px;">Montant réglé</td><td style="text-align:right;color:#A8833B;font-size:20px;font-family:'Georgia',serif;font-weight:500;">${opts.amount}</td></tr>
            </table>
          </div>
          <p style="font-size:13px;color:#7D7060;font-style:italic;margin-bottom:24px;">${opts.proName} a été notifié et vous recontactera sous 48 h.</p>
          <a href="${opts.dashboardUrl}" style="display:inline-block;background:#A8833B;color:#FAF8F4;padding:14px 28px;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
            Voir mon carnet →
          </a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #D4C9B3;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8A7B63;">Le Carnet des noces · Perpignan &amp; Roussillon</p>
        </div>
      </div>
    `,
  });
}

export async function sendDonationReceiptEmail(opts: { to: string; couplePrenoms: string; amountNet: number }) {
  return resend.emails.send({
    from: FROM, to: opts.to,
    subject: `Merci pour votre participation — ${opts.couplePrenoms}`,
    html: `<p>Votre don de ${(opts.amountNet/100).toLocaleString("fr-FR")} € pour ${opts.couplePrenoms} a bien été reçu. Merci !</p><hr/><p style="font-size:12px;color:#8A7B63;">Le Carnet des noces · Perpignan &amp; Roussillon</p>`,
  });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  resetUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to:   opts.to,
    subject: `Réinitialisation de votre mot de passe — Le Carnet des noces`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#FAF8F4;padding:0;">
        <div style="background:#1A1510;padding:24px 32px;">
          <p style="margin:0;font-family:'Georgia',serif;font-size:18px;color:#FAF8F4;letter-spacing:0.04em;">
            Le Carnet <em style="color:#A8833B;">des noces</em>
          </p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#A8833B;font-family:'Jost',sans-serif;">
            Sécurité du compte
          </p>
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:300;color:#1A1510;">
            Réinitialiser votre mot de passe
          </h2>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#3D3530;">
            Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
          </p>
          <a href="${opts.resetUrl}"
             style="display:inline-block;background:#A8833B;color:#FAF8F4;padding:14px 28px;text-decoration:none;font-family:'Jost',sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">
            Réinitialiser mon mot de passe →
          </a>
          <p style="margin:24px 0 0;font-size:13px;color:#7D7060;font-style:italic;line-height:1.6;">
            Ce lien est valable 1 heure. Si vous n'avez pas fait cette demande, ignorez simplement cet email.
          </p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #D4C9B3;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8A7B63;">
            Le Carnet des noces · Perpignan &amp; Roussillon
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendDonationNotifEmail(opts: {
  to: string;
  amountNet: number;
  donorName?: string | null;
  isAnonymous?: boolean;
  message?: string | null;
  dreamTitle?: string | null;
}) {
  const donor = opts.isAnonymous ? "Un·e invité·e anonyme" : (opts.donorName || "Un·e invité·e");
  const amount = (opts.amountNet / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 });

  return resend.emails.send({
    from: FROM,
    to:   opts.to,
    subject: `✦ Nouveau don reçu — ${amount} €`,
    html: `
      <div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;background:#FAF8F4;">
        <div style="background:#1A1510;padding:20px 28px;">
          <p style="margin:0;font-size:16px;color:#FAF8F4;">Le Carnet <em style="color:#A8833B;">des noces</em></p>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#A8833B;">Nouveau don</p>
          <h2 style="margin:0 0 20px;font-size:1.8rem;font-weight:300;color:#1A1510;">
            ${donor} a participé à votre cagnotte.
          </h2>
          <div style="background:#F2ECE1;border-left:3px solid #A8833B;padding:16px 20px;margin-bottom:20px;">
            <table style="width:100%;font-family:'Georgia',serif;font-size:14px;">
              <tr>
                <td style="color:#7D7060;padding:5px 0;">Montant</td>
                <td style="text-align:right;font-size:1.4rem;color:#A8833B;font-style:italic;">${amount} €</td>
              </tr>
              ${opts.dreamTitle ? `<tr><td style="color:#7D7060;padding:5px 0;">Pour</td><td style="text-align:right;">${opts.dreamTitle}</td></tr>` : ""}
              ${opts.message ? `<tr><td colspan="2" style="padding:10px 0 0;border-top:1px dashed #D4C9B3;margin-top:8px;font-style:italic;color:#1A1510;">"${opts.message}"</td></tr>` : ""}
            </table>
          </div>
          <a href="${APP_URL}/carnet/cagnotte" style="display:inline-block;background:#A8833B;color:#FAF8F4;padding:12px 24px;text-decoration:none;font-family:'Jost',sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">
            Voir ma cagnotte →
          </a>
        </div>
        <div style="padding:14px 28px;border-top:1px solid #D4C9B3;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8A7B63;">Le Carnet des noces · Perpignan &amp; Roussillon</p>
        </div>
      </div>
    `,
  });
}
