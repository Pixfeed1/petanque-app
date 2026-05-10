// /app/api/webhooks/stripe/route.ts
// FIX BUSINESS : org_id lu depuis subscription.metadata.org_id (posé par
// create-checkout-session). Plus de (SELECT org_id FROM users) cassé.
// Fallback : si pas dans metadata, on retombe sur user_roles.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { query, queryOne } from '@/lib/db'
import { getFeaturesForPlan } from '@/lib/plans'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil'
    })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

/**
 * Résout l'org_id à partir des metadata Stripe, avec fallback DB pour les
 * abonnements créés avant ce fix (qui n'ont pas org_id dans metadata).
 */
async function resolveOrgId(
  metadata: Stripe.Metadata | null | undefined,
  userId: string | null | undefined
): Promise<string | null> {
  if (metadata?.org_id) return String(metadata.org_id)
  if (!userId) return null

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
  if (!stripe || !webhookSecret) {
    console.error('Stripe ou webhook secret non configuré')
    return NextResponse.json({ error: 'Configuration Stripe manquante' }, { status: 500 })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Erreur de vérification webhook:', errorMessage)
      return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 })
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Erreur webhook:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id
  if (!userId) {
    console.error('user_id manquant dans metadata', subscription.id)
    return
  }

  const orgId = await resolveOrgId(subscription.metadata, userId)
  if (!orgId) {
    console.error(`Aucune org_id pour user ${userId} (subscription ${subscription.id})`)
    return
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing'
  const product = subscription.metadata.product || 'essentiel'
  const plan = isActive
    ? (['essentiel', 'club'].includes(product) ? product : 'essentiel')
    : 'free'

  const currentPeriodEnd = (subscription as any).current_period_end
    ? new Date((subscription as any).current_period_end * 1000).toISOString()
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

  try {
    await query(
      `UPDATE users
       SET metadata = jsonb_set(
         jsonb_set(
           jsonb_set(
             jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{subscription,status}',
               $1::jsonb
             ),
             '{subscription,plan}',
             $2::jsonb
           ),
           '{subscription,stripe_subscription_id}',
           $3::jsonb
         ),
         '{subscription,current_period_end}',
         $4::jsonb
       )
       WHERE id = $5`,
      [
        JSON.stringify(plan),
        JSON.stringify(plan !== 'free' ? plan + '_yearly' : 'free'),
        JSON.stringify(subscription.id),
        JSON.stringify(currentPeriodEnd),
        userId
      ]
    )

    const features = getFeaturesForPlan(plan)
    await query(
      `UPDATE organisations
       SET settings = jsonb_set(
         jsonb_set(
           COALESCE(settings, '{}'::jsonb),
           '{plan}',
           $1::jsonb
         ),
         '{features}',
         $2::jsonb
       )
       WHERE id = $3`,
      [JSON.stringify(plan), JSON.stringify(features), orgId]
    )
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'abonnement:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id
  if (!userId) {
    console.error('user_id manquant (subscription deleted)', subscription.id)
    return
  }

  const orgId = await resolveOrgId(subscription.metadata, userId)
  if (!orgId) {
    console.error(`Aucune org_id pour user ${userId}`)
    return
  }

  try {
    await query(
      `UPDATE users
       SET metadata = jsonb_set(
         jsonb_set(
           COALESCE(metadata, '{}'::jsonb),
           '{subscription,status}',
           '"free"'::jsonb
         ),
         '{subscription,plan}',
         '"free"'::jsonb
       )
       WHERE id = $1`,
      [userId]
    )

    const features = getFeaturesForPlan('free')
    await query(
      `UPDATE organisations
       SET settings = jsonb_set(
         jsonb_set(
           COALESCE(settings, '{}'::jsonb),
           '{plan}',
           '"free"'::jsonb
         ),
         '{features}',
         $1::jsonb
       )
       WHERE id = $2`,
      [JSON.stringify(features), orgId]
    )
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'abonnement:', error)
    throw error
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription
  if (!subscriptionId) return

  try {
    if (!stripe) return
    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)

    if (subscription.metadata.user_id) {
      await query(
        `INSERT INTO payment_attempts
         (user_id, stripe_session_id, stripe_customer_id, amount, currency, status, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         ON CONFLICT (stripe_session_id) DO UPDATE
         SET status = 'completed', completed_at = CURRENT_TIMESTAMP`,
        [
          subscription.metadata.user_id,
          invoice.id,
          invoice.customer as string,
          (invoice as any).amount_paid || 0,
          invoice.currency,
          'completed'
        ]
      )
    }
  } catch (error) {
    console.error('Erreur lors du traitement du paiement réussi:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription
  if (!subscriptionId) return

  try {
    if (!stripe) return
    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)

    if (subscription.metadata.user_id) {
      await query(
        `INSERT INTO payment_attempts
         (user_id, stripe_session_id, stripe_customer_id, amount, currency, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          subscription.metadata.user_id,
          invoice.id,
          invoice.customer as string,
          (invoice as any).amount_due || 0,
          invoice.currency,
          'failed'
        ]
      )
    }
  } catch (error) {
    console.error('Erreur lors du traitement de l\'échec de paiement:', error)
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  if (!userId) {
    console.error('user_id manquant (session)', session.id)
    return
  }

  // Pour subscription, on laisse subscription.created faire le job
  if (session.mode === 'subscription') return

  const orgId = await resolveOrgId(session.metadata, userId)
  if (!orgId) {
    console.error(`Aucune org_id pour user ${userId}`)
    return
  }

  const checkoutProduct = session.metadata?.product || 'essentiel'
  const checkoutPlan = ['essentiel', 'club'].includes(checkoutProduct) ? checkoutProduct : 'essentiel'

  try {
    await query(
      `UPDATE users
       SET metadata = jsonb_set(
         jsonb_set(
           COALESCE(metadata, '{}'::jsonb),
           '{subscription,status}',
           $1::jsonb
         ),
         '{subscription,plan}',
         $2::jsonb
       )
       WHERE id = $3`,
      [JSON.stringify(checkoutPlan), JSON.stringify(checkoutPlan + '_yearly'), userId]
    )

    const features = getFeaturesForPlan(checkoutPlan)
    await query(
      `UPDATE organisations
       SET settings = jsonb_set(
         jsonb_set(
           COALESCE(settings, '{}'::jsonb),
           '{plan}',
           $1::jsonb
         ),
         '{features}',
         $2::jsonb
       )
       WHERE id = $3`,
      [JSON.stringify(checkoutPlan), JSON.stringify(features), orgId]
    )
  } catch (error) {
    console.error('Erreur lors de l\'activation du plan après checkout:', error)
    throw error
  }
}
