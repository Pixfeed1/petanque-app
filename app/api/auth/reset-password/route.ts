import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting: 3 demandes de reset max par IP toutes les 60 minutes
  const rateLimitResponse = applyRateLimit(request, 'reset-password', RATE_LIMITS.resetPassword)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe
    const user = await queryOne(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    // Pour des raisons de sécurité, on retourne toujours un succès
    // même si l'email n'existe pas (éviter l'énumération d'emails)
    if (!user) {
      return NextResponse.json({
        message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
      })
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex')
    // FIX SÉCURITÉ : on stocke le hash SHA-256 en DB et le token brut est
    // envoyé par email. Si la DB fuite, les tokens ne sont pas utilisables
    // tels quels (l'attaquant n'aurait que les hashs).
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const resetTokenExpires = new Date(Date.now() + 3600000) // 1 heure

    // Sauvegarder le HASH du token en base (jamais le token brut)
    await query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires = $2, updated_at = NOW()
       WHERE id = $3`,
      [resetTokenHash, resetTokenExpires, user.id]
    )

    // Construire le lien de réinitialisation
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

    // Configuration du transporteur SMTP
    // Variables d'environnement à définir :
    // SMTP_HOST (défaut: localhost)
    // SMTP_PORT (défaut: 25)
    // SMTP_USER (optionnel)
    // SMTP_PASS (optionnel)
    // SMTP_FROM (défaut: noreply@petanquepro.fr)

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '25'),
      secure: false, // true pour port 465, false pour autres ports
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined,
      // Options pour dev/test sans SSL
      tls: {
        rejectUnauthorized: false
      }
    })

    // Template HTML de l'email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(to right, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #059669; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Pétanque Pro</h1>
            <p>Réinitialisation de mot de passe</p>
          </div>
          <div class="content">
            <p>Bonjour ${user.full_name || 'Utilisateur'},</p>

            <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Pétanque Pro.</p>

            <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>

            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </p>

            <p>Ou copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-size: 12px;">
              ${resetUrl}
            </p>

            <div class="warning">
              <strong>⏰ Important :</strong> Ce lien expirera dans <strong>1 heure</strong>.
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
              Votre mot de passe actuel restera inchangé.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Pétanque Pro - Gestion de tournois de pétanque</p>
            <p>Cet email a été envoyé à ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Envoyer l'email
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@petanquepro.fr',
        to: email,
        subject: '🔐 Réinitialisation de votre mot de passe - Pétanque Pro',
        html: emailHtml,
        // Version texte pour clients email sans HTML
        text: `
Réinitialisation de mot de passe - Pétanque Pro

Bonjour ${user.full_name || 'Utilisateur'},

Vous avez demandé à réinitialiser votre mot de passe.

Cliquez sur ce lien pour définir un nouveau mot de passe :
${resetUrl}

⏰ Important : Ce lien expirera dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

---
© ${new Date().getFullYear()} Pétanque Pro
        `.trim()
      })

    } catch (emailError) {
      console.error('Erreur envoi email:', emailError)

      if (process.env.NODE_ENV !== 'development') {
        // En production: ne pas exposer l'erreur
        throw new Error('Impossible d\'envoyer l\'email')
      }
    }

    return NextResponse.json({
      message: 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.',
      // En dev: retourner le token pour faciliter les tests
      ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl })
    })

  } catch (error) {
    console.error('Erreur reset password:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation' },
      { status: 500 }
    )
  }
}
