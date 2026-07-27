/**
 * Envoi d'emails (SMTP) — mutualise la configuration nodemailer utilisée par le reset
 * de mot de passe et la vérification d'email. Best-effort : un échec SMTP n'interrompt
 * jamais le flux appelant (on log et on continue).
 */
import nodemailer from 'nodemailer'

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '25'),
    secure: false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })
}

export async function sendMail(opts: { to: string; subject: string; html: string }): Promise<void> {
  await transporter().sendMail({
    from: process.env.SMTP_FROM || 'noreply@petanquepro.fr',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  })
}

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/** Email d'activation de compte (double opt-in). */
export async function sendVerificationEmail(email: string, token: string, name?: string): Promise<void> {
  const url = `${appUrl().replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`
  const html = `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a3322">
    <h2 style="color:#2d5530">Bienvenue sur Pétanque Pro ${name ? ', ' + name : ''} 🎉</h2>
    <p>Il ne reste qu'une étape : <strong>active ton compte</strong> en cliquant sur le bouton ci-dessous.</p>
    <p style="text-align:center;margin:28px 0">
      <a href="${url}" style="background:#1a3322;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">
        Activer mon compte
      </a>
    </p>
    <p style="font-size:13px;color:#5a6b4d">Ou copie ce lien dans ton navigateur :<br><a href="${url}" style="color:#2d5530">${url}</a></p>
    <p style="font-size:13px;color:#5a6b4d">Ce lien expire dans 7 jours. Si tu n'es pas à l'origine de cette inscription, ignore cet email.</p>
  </div>`
  await sendMail({ to: email, subject: '✅ Active ton compte - Pétanque Pro', html })
}
