// /app/api/create-checkout-session/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { query } from '@/lib/db'
import { createCheckoutSessionSchema, validateRequest } from '@/lib/validations'

// Initialiser Stripe uniquement si la clé est disponible
// Note: apiVersion non spécifiée = Stripe utilise automatiquement la version du package
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
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

   // Déterminer le plan demandé (essentiel ou club)
   const planType = body.planType || 'essentiel'
   if (!['essentiel', 'club'].includes(planType)) {
     return NextResponse.json(
       { error: 'Plan invalide' },
       { status: 400 }
     )
   }

   // Utiliser le bon price ID selon le plan
   if (!priceId) {
     priceId = planType === 'club'
       ? process.env.STRIPE_PRICE_ID_CLUB
       : process.env.STRIPE_PRICE_ID_ESSENTIEL || process.env.STRIPE_PRICE_ID
   }

   // Vérifier si l'utilisateur n'est pas déjà abonné
   const userResult = await query(
     `SELECT metadata FROM users WHERE id = $1`,
     [userId]
   )

   const existingProfile = userResult.rows[0]
   const metadata = existingProfile?.metadata || {}
   const subscription = metadata.subscription || {}

   if (['essentiel', 'club', 'premium'].includes(subscription.status)) {
     return NextResponse.json(
       { error: 'Vous avez déjà un abonnement actif' },
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
   if (!priceId) {
     return NextResponse.json(
       { error: 'Aucun prix configuré pour ce plan. Vérifiez STRIPE_PRICE_ID_ESSENTIEL / STRIPE_PRICE_ID_CLUB dans .env' },
       { status: 500 }
     )
   }
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
       product: planType
     },
     // IMPORTANT: Métadonnées pour l'abonnement (pour les webhooks subscription.*)
     subscription_data: {
       metadata: {
         user_id: userId,
         user_email: userEmail,
         product: planType
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
         message: planType === 'club' ? 'Passer au plan Club' : 'Passer au plan Essentiel'
       }
     },
     
     // Consentements légaux
     consent_collection: {
       terms_of_service: 'required'
     }
   })

   // Logger la création de session pour debug (sans données sensibles)
   console.log('Session Checkout créée:', {
     sessionId: session.id.slice(0, 8) + '...',  // Masquer partiellement
     userId,
     priceId: finalPriceId
   })

   // Créer un enregistrement de la tentative de paiement
   await query(
     `INSERT INTO payment_attempts
      (user_id, stripe_session_id, stripe_customer_id, amount, currency, status)
      VALUES ($1, $2, $3, $4, $5, $6)`,
     [userId, session.id, customerId, planType === 'club' ? 1999 : 999, 'eur', 'pending']
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
     // Déterminer le plan depuis les métadonnées de la session
     const activatedPlan = session.metadata?.product || 'essentiel'
     const planName = ['essentiel', 'club'].includes(activatedPlan) ? activatedPlan : 'essentiel'

     // Mettre à jour l'utilisateur
     try {
       await query(
         `UPDATE users
          SET metadata = jsonb_set(
            jsonb_set(
              jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{subscription,status}',
                $1::jsonb
              ),
              '{subscription,plan}',
              $2::jsonb
            ),
            '{subscription,subscribed_since}',
            $3::jsonb
          )
          WHERE id = $4`,
         [JSON.stringify(planName), JSON.stringify(planName + '_yearly'), JSON.stringify(new Date().toISOString()), userId]
       )

       // Mettre à jour l'organisation (CRITIQUE pour le dashboard)
       await query(
         `UPDATE organisations
          SET settings = jsonb_set(
            COALESCE(settings, '{}'::jsonb),
            '{plan}',
            $1::jsonb
          )
          WHERE id = (SELECT org_id FROM users WHERE id = $2)`,
         [JSON.stringify(planName), userId]
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
       status: planName,
       message: `Paiement réussi - Plan ${planName === 'club' ? 'Club' : 'Essentiel'} activé`
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