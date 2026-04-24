import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function sendNewMessageEmail(opts: {
  to: string;
  recipientName: string;
  senderName: string;
  messagePreview: string;
  conversationUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Nouveau message de ${opts.senderName} — Le Carnet des noces`,
    html: `
      <p>Bonjour ${opts.recipientName},</p>
      <p>${opts.senderName} vous a envoyé un message :</p>
      <blockquote style="border-left:3px solid #A8833B;padding-left:16px;color:#7D7060;font-style:italic;">
        ${opts.messagePreview}
      </blockquote>
      <p><a href="${opts.conversationUrl}" style="color:#A8833B;">Répondre depuis votre espace</a></p>
      <hr/>
      <p style="font-size:12px;color:#8A7B63;">Le Carnet des noces · Perpignan &amp; Roussillon</p>
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
