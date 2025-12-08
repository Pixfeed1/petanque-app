// /app/api/create-portal-session/route.ts
// API pour créer une session du portail client Stripe

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { query } from '@/lib/db'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe non configuré' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId manquant' },
        { status: 400 }
      )
    }

    // Récupérer le customer ID de l'utilisateur
    const userResult = await query(
      `SELECT metadata FROM users WHERE id = $1`,
      [userId]
    )

    const metadata = userResult.rows[0]?.metadata || {}
    const customerId = metadata.subscription?.stripe_customer_id

    if (!customerId) {
      return NextResponse.json(
        { error: 'Aucun abonnement Stripe trouvé pour cet utilisateur' },
        { status: 400 }
      )
    }

    // URL de retour après le portail
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Créer la session du portail client
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard`
    })

    return NextResponse.json({ url: session.url })

  } catch (error: unknown) {
    console.error('Erreur création session portail:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session', details: errorMessage },
      { status: 500 }
    )
  }
}
