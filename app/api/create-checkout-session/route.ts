// /app/api/create-checkout-session/route.ts
// FIX SÉCURITÉ : userId/userEmail viennent de auth.user (cookie), plus du body.
// FIX BUSINESS : org_id stocké dans metadata Stripe pour que le webhook
// active le bon plan sans dépendre d'un (SELECT org_id FROM users) cassé.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { query, queryOne } from '@/lib/db'
import { requireAuth } from '@/lib/middleware'
import { createCheckoutSessionSchema, validateRequest } from '@/lib/validations'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

/**
 * Récupère l'org_id principale d'un user (la plus ancienne dont il est owner).
 */
async function getPrimaryOrgIdForUser(userId: string): Promise<string | null> {
  const row = await queryOne<{ org_id: string | number }>(
    `SELECT org_id FROM user_roles
     WHERE user_id = $1 AND role = 'owner'
     ORDER BY granted_at ASC
     LIMIT 1`,
    [userId]
  )
  return row?.org_id != null ? String(row.org_id) : null
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth obligatoire — identité prise du cookie, plus jamais du body
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const validation = validateRequest(createCheckoutSessionSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }
    const { planType } = validation.data

    // 2. priceId calculé côté serveur depuis planType — JAMAIS lu du body
    const priceId = planType === 'club'
      ? process.env.STRIPE_PACK_CLUB_PRICE_ID
      : process.env.STRIPE_PRICE_ID

    if (!priceId) {
      return NextResponse.json(
        { error: `Aucun prix configuré pour le plan ${planType}. Vérifiez STRIPE_PRICE_ID / STRIPE_PACK_CLUB_PRICE_ID dans .env` },
        { status: 500 }
      )
    }

    // 3. Récupérer l'org du user — nécessaire pour que le webhook active le bon org
    const orgId = await getPrimaryOrgIdForUser(String(user.id))
    if (!orgId) {
      return NextResponse.json(
        { error: 'Aucune organisation trouvée pour cet utilisateur' },
        { status: 400 }
      )
    }

    // 4. Vérifier qu'il n'a pas déjà un abonnement actif
    const existing = await queryOne<{ metadata: any }>(
      `SELECT metadata FROM users WHERE id = $1`,
      [user.id]
    )
    const subscription = existing?.metadata?.subscription || {}
    if (['essentiel', 'club'].includes(subscription.status)) {
      return NextResponse.json(
        { error: 'Vous avez déjà un abonnement actif' },
        { status: 400 }
      )
    }

    // 5. Customer Stripe (créer si pas encore lié)
    let customerId: string | undefined = subscription.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: String(user.id), org_id: orgId }
      })
      customerId = customer.id
      await query(
        `UPDATE users SET metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{subscription,stripe_customer_id}',
            $1::jsonb
          ) WHERE id = $2`,
        [JSON.stringify(customerId), user.id]
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 6. Metadata copiées sur la session ET sur la subscription
    const metadata = {
      user_id: String(user.id),
      user_email: user.email,
      org_id: orgId,
      product: planType
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: { metadata }, // CRUCIAL : copié sur la subscription
      success_url: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?payment=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      custom_text: {
        submit: { message: planType === 'club' ? 'Passer au plan Club' : 'Passer au plan Essentiel' }
      },
      consent_collection: { terms_of_service: 'required' }
    })

    // 7. Tracer la tentative
    await query(
      `INSERT INTO payment_attempts
       (user_id, stripe_session_id, stripe_customer_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, session.id, customerId, planType === 'club' ? 1999 : 999, 'eur', 'pending']
    )

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: unknown) {
    console.error('Erreur création session Stripe:', error)
    const stripeError = error as { type?: string; message?: string }

    if (stripeError.type === 'StripeCardError') {
      return NextResponse.json({ error: 'Erreur avec la carte bancaire' }, { status: 400 })
    }
    if (stripeError.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: 'Configuration Stripe invalide' }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: 'Une erreur est survenue lors de la création du paiement',
        details: stripeError.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// FIX SÉCURITÉ : auth obligatoire ET vérif que la session appartient au user
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id manquant' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // La session doit appartenir au user connecté
    if (session.metadata?.user_id !== String(user.id)) {
      return NextResponse.json({ error: 'Session inaccessible' }, { status: 403 })
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        status: session.payment_status,
        message: 'Paiement en attente ou échoué'
      })
    }

    // L'activation du plan est faite par le webhook. Ici on retourne juste le statut.
    const planName = session.metadata?.product === 'club' ? 'club' : 'essentiel'

    return NextResponse.json({
      success: true,
      status: planName,
      message: `Paiement réussi - Plan ${planName === 'club' ? 'Club' : 'Essentiel'} activé`
    })
  } catch (error: unknown) {
    console.error('Erreur vérification paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du paiement' },
      { status: 500 }
    )
  }
}
