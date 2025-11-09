import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
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
    const resetTokenExpires = new Date(Date.now() + 3600000) // 1 heure

    // Sauvegarder le token en base
    await query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires = $2, updated_at = NOW()
       WHERE id = $3`,
      [resetToken, resetTokenExpires, user.id]
    )

    // Construire le lien de réinitialisation
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

    // NOTE: Pour l'instant, on log juste l'URL dans la console
    // En production, vous devriez envoyer un email via un service comme SendGrid, Resend, etc.
    console.log('='.repeat(80))
    console.log('🔐 RÉINITIALISATION DE MOT DE PASSE')
    console.log('='.repeat(80))
    console.log(`Email: ${email}`)
    console.log(`Token: ${resetToken}`)
    console.log(`Lien: ${resetUrl}`)
    console.log(`Expire: ${resetTokenExpires.toLocaleString('fr-FR')}`)
    console.log('='.repeat(80))
    console.log('')
    console.log('⚠️  En production, cet email devrait être envoyé via un service SMTP')
    console.log('   Exemples: SendGrid, Resend, Nodemailer, etc.')
    console.log('')
    console.log('='.repeat(80))

    // TODO: Implémenter l'envoi d'email
    // Exemple avec Resend:
    // await resend.emails.send({
    //   from: 'noreply@petanquepro.fr',
    //   to: email,
    //   subject: 'Réinitialisation de votre mot de passe',
    //   html: `
    //     <h2>Réinitialisation de mot de passe</h2>
    //     <p>Bonjour ${user.full_name},</p>
    //     <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
    //     <a href="${resetUrl}">${resetUrl}</a>
    //     <p>Ce lien expirera dans 1 heure.</p>
    //   `
    // })

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
