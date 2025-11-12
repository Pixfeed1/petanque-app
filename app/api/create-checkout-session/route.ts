// /app/api/create-checkout-session/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { query } from '@/lib/db'
import { createCheckoutSessionSchema, validateRequest } from '@/lib/validations'

// Initialiser Stripe uniquement si la clé est disponible
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia'
    })
  : null

export async function POST(request: NextRequest) {
 try {
   // Vérifier que Stripe est initialisé
   if (!stripe) {
     return NextResponse.json(
       { error: 'Stripe non configuré' },
       { status: 500 }
     )
   }

   // Récupérer les données de la requête
   const body = await request.json()

   // Validation Zod
   const validation = validateRequest(createCheckoutSessionSchema, body)
   if (!validation.success) {
     return NextResponse.json(
       { error: validation.errors.join(', ') },
       { status: 400 }
     )
   }

   const { userId, userEmail } = validation.data
   let priceId = validation.data.priceId

   // Utiliser le STRIPE_PRICE_ID de l'env si disponible et aucun priceId fourni
   if (!priceId && process.env.STRIPE_PRICE_ID) {
     priceId = process.env.STRIPE_PRICE_ID
   }

   // Si c'est le plan gratuit, pas besoin de Stripe
   if (!priceId) {
     // Mettre à jour l'utilisateur en gratuit dans la DB
     try {
       await query(
         `UPDATE users
          SET metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{subscription}',
            '{"status": "free", "plan": "gratuit"}'::jsonb
          )
          WHERE id = $1`,
         [userId]
       )
     } catch (error) {
       console.error('Erreur mise à jour profil:', error)
     }

     return NextResponse.json({
       success: true,
       plan: 'gratuit',
       message: 'Plan gratuit activé'
     })
   }

   // Vérifier si l'utilisateur n'est pas déjà Premium
   const userResult = await query(
     `SELECT metadata FROM users WHERE id = $1`,
     [userId]
   )

   const existingProfile = userResult.rows[0]
   const metadata = existingProfile?.metadata || {}
   const subscription = metadata.subscription || {}

   if (subscription.status === 'premium') {
     return NextResponse.json(
       { error: 'Vous êtes déjà Premium' },
       { status: 400 }
     )
   }

   // Créer ou récupérer le customer Stripe
   let customerId = subscription.stripe_customer_id

   if (!customerId) {
     // Créer un nouveau customer Stripe
     const customer = await stripe.customers.create({
       email: userEmail,
       metadata: {
         user_id: userId
       }
     })
     customerId = customer.id

     // Sauvegarder le customer ID dans la DB
     await query(
       `UPDATE users
        SET metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{subscription,stripe_customer_id}',
          $1::jsonb
        )
        WHERE id = $2`,
       [JSON.stringify(customerId), userId]
     )
   }

   // Utiliser le priceId (soit fourni, soit depuis STRIPE_PRICE_ID env)
   const finalPriceId: string = priceId

   // URL de base pour les redirections
   const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

   // Créer la session Stripe Checkout
   const session = await stripe.checkout.sessions.create({
     customer: customerId,
     payment_method_types: ['card'],
     mode: 'subscription', // Abonnement annuel
     line_items: [
       {
         price: finalPriceId,
         quantity: 1
       }
     ],
     // Métadonnées pour le webhook de session
     metadata: {
       user_id: userId,
       user_email: userEmail,
       product: 'premium'
     },
     // IMPORTANT: Métadonnées pour l'abonnement (pour les webhooks subscription.*)
     subscription_data: {
       metadata: {
         user_id: userId,
         user_email: userEmail,
         product: 'premium'
       }
     },
     // URLs de redirection après paiement
     success_url: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${baseUrl}/checkout?payment=cancelled`,

     // Options supplémentaires
     allow_promotion_codes: true, // Permettre les codes promo
     billing_address_collection: 'auto',

     // Personnalisation
     custom_text: {
       submit: {
         message: 'Passer Premium'
       }
     },
     
     // Consentements légaux
     consent_collection: {
       terms_of_service: 'required'
     },
     
     // Facture automatique
     invoice_creation: {
       enabled: true
     }
   })

   // Logger la création de session pour debug
   console.log('Session Checkout créée:', {
     sessionId: session.id,
     userId,
     userEmail,
     priceId: finalPriceId
   })

   // Créer un enregistrement de la tentative de paiement
   await query(
     `INSERT INTO payment_attempts
      (user_id, stripe_session_id, stripe_customer_id, amount, currency, status)
      VALUES ($1, $2, $3, $4, $5, $6)`,
     [userId, session.id, customerId, 499, 'eur', 'pending']
   )

   // Retourner l'ID de session pour la redirection
   return NextResponse.json({
     sessionId: session.id,
     url: session.url
   })

 } catch (error: unknown) {
   console.error('Erreur création session Stripe:', error)

   // Gestion des erreurs spécifiques Stripe
   const stripeError = error as { type?: string; message?: string }

   if (stripeError.type === 'StripeCardError') {
     return NextResponse.json(
       { error: 'Erreur avec la carte bancaire' },
       { status: 400 }
     )
   }

   if (stripeError.type === 'StripeInvalidRequestError') {
     return NextResponse.json(
       { error: 'Configuration Stripe invalide' },
       { status: 400 }
     )
   }

   // Erreur générique
   return NextResponse.json(
     {
       error: 'Une erreur est survenue lors de la création du paiement',
       details: stripeError.message || 'Unknown error'
     },
     { status: 500 }
   )
 }
}

// Endpoint pour vérifier le statut de paiement
export async function GET(request: NextRequest) {
 try {
   // Vérifier que Stripe est initialisé
   if (!stripe) {
     return NextResponse.json(
       { error: 'Stripe non configuré' },
       { status: 500 }
     )
   }

   const { searchParams } = new URL(request.url)
   const sessionId = searchParams.get('session_id')
   const userId = searchParams.get('user_id')

   if (!sessionId || !userId) {
     return NextResponse.json(
       { error: 'Paramètres manquants' },
       { status: 400 }
     )
   }

   // Récupérer la session Stripe
   const session = await stripe.checkout.sessions.retrieve(sessionId)

   // Vérifier le statut du paiement
   if (session.payment_status === 'paid') {
     // Mettre à jour l'utilisateur en Premium
     try {
       await query(
         `UPDATE users
          SET metadata = jsonb_set(
            jsonb_set(
              jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{subscription,status}',
                '"premium"'::jsonb
              ),
              '{subscription,plan}',
              '"premium_lifetime"'::jsonb
            ),
            '{subscription,premium_since}',
            $1::jsonb
          )
          WHERE id = $2`,
         [JSON.stringify(new Date().toISOString()), userId]
       )

       // Mettre à jour l'organisation en Premium (CRITIQUE pour le dashboard)
       await query(
         `UPDATE organisations
          SET settings = jsonb_set(
            COALESCE(settings, '{}'::jsonb),
            '{plan}',
            '"premium"'::jsonb
          )
          WHERE id = (SELECT org_id FROM users WHERE id = $1)`,
         [userId]
       )

       // Mettre à jour l'enregistrement de paiement
       await query(
         `UPDATE payment_attempts
          SET status = $1,
              completed_at = CURRENT_TIMESTAMP,
              stripe_payment_intent = $2
          WHERE stripe_session_id = $3`,
         ['completed', session.payment_intent as string, sessionId]
       )
     } catch (updateError) {
       console.error('Erreur mise à jour profil:', updateError)
       throw updateError
     }

     return NextResponse.json({
       success: true,
       status: 'premium',
       message: 'Paiement réussi - Compte Premium activé'
     })
   }

   return NextResponse.json({
     success: false,
     status: session.payment_status,
     message: 'Paiement en attente ou échoué'
   })

 } catch (error: unknown) {
   console.error('Erreur vérification paiement:', error)
   return NextResponse.json(
     { error: 'Erreur lors de la vérification du paiement' },
     { status: 500 }
   )
 }
}