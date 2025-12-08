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

   const { userId, userEmail, product } = validation.data
   let priceId = validation.data.priceId

   // Déterminer le prix en fonction du produit
   const isPackClub = product === 'pack_club'

   if (!priceId) {
     if (isPackClub) {
       // Pack Club 9.99€ - Utiliser STRIPE_PACK_CLUB_PRICE_ID
       priceId = process.env.STRIPE_PACK_CLUB_PRICE_ID || null
     } else {
       // Premium 19.99€ - Utiliser STRIPE_PRICE_ID
       priceId = process.env.STRIPE_PRICE_ID || null
     }
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

   // Vérifier si l'utilisateur n'a pas déjà le produit demandé
   const userResult = await query(
     `SELECT u.metadata, o.settings as org_settings
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN organisations o ON o.id = ur.org_id
      WHERE u.id = $1`,
     [userId]
   )

   const existingProfile = userResult.rows[0]
   const metadata = existingProfile?.metadata || {}
   const orgSettings = existingProfile?.org_settings || {}
   const subscription = metadata.subscription || {}

   if (isPackClub) {
     // Vérifier si Pack Club déjà actif
     if (orgSettings.pack_club === true) {
       return NextResponse.json(
         { error: 'Vous avez déjà le Pack Club actif' },
         { status: 400 }
       )
     }
   } else {
     // Vérifier si déjà Premium
     if (subscription.status === 'premium') {
       return NextResponse.json(
         { error: 'Vous êtes déjà Premium' },
         { status: 400 }
       )
     }
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

   // Configuration selon le produit
   const productConfig = isPackClub
     ? {
         productName: 'pack_club',
         successUrl: `${baseUrl}/dashboard?payment=success&product=pack_club&session_id={CHECKOUT_SESSION_ID}`,
         submitMessage: 'Activer Pack Club',
         amount: 999 // 9.99€
       }
     : {
         productName: 'premium',
         successUrl: `${baseUrl}/dashboard?payment=success&product=premium&session_id={CHECKOUT_SESSION_ID}`,
         submitMessage: 'Passer Premium',
         amount: 1999 // 19.99€
       }

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
       product: productConfig.productName
     },
     // IMPORTANT: Métadonnées pour l'abonnement (pour les webhooks subscription.*)
     subscription_data: {
       metadata: {
         user_id: userId,
         user_email: userEmail,
         product: productConfig.productName
       }
     },
     // URLs de redirection après paiement
     success_url: productConfig.successUrl,
     cancel_url: `${baseUrl}/checkout?payment=cancelled&product=${productConfig.productName}`,

     // Options supplémentaires
     allow_promotion_codes: true, // Permettre les codes promo
     billing_address_collection: 'auto',

     // Personnalisation
     custom_text: {
       submit: {
         message: productConfig.submitMessage
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
     priceId: finalPriceId,
     product: productConfig.productName
   })

   // Créer un enregistrement de la tentative de paiement
   await query(
     `INSERT INTO payment_attempts
      (user_id, stripe_session_id, stripe_customer_id, amount, currency, status)
      VALUES ($1, $2, $3, $4, $5, $6)`,
     [userId, session.id, customerId, productConfig.amount, 'eur', 'pending']
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

   // Déterminer le type de produit depuis les métadonnées
   const productType = session.metadata?.product || 'premium'
   const isPackClub = productType === 'pack_club'

   // Vérifier le statut du paiement
   if (session.payment_status === 'paid') {
     try {
       if (isPackClub) {
         // Activer Pack Club sur l'organisation
         await query(
           `UPDATE organisations
            SET settings = jsonb_set(
              COALESCE(settings, '{}'::jsonb),
              '{pack_club}',
              'true'::jsonb
            )
            WHERE id = (SELECT ur.org_id FROM user_roles ur WHERE ur.user_id = $1 LIMIT 1)`,
           [userId]
         )

         // Enregistrer les infos Pack Club dans le user metadata
         await query(
           `UPDATE users
            SET metadata = jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{subscription,pack_club}',
              $1::jsonb
            )
            WHERE id = $2`,
           [JSON.stringify({
             active: true,
             purchased_at: new Date().toISOString(),
             stripe_subscription_id: session.subscription as string
           }), userId]
         )
       } else {
         // Mettre à jour l'utilisateur en Premium
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

         // Mettre à jour l'organisation en Premium
         await query(
           `UPDATE organisations
            SET settings = jsonb_set(
              COALESCE(settings, '{}'::jsonb),
              '{plan}',
              '"premium"'::jsonb
            )
            WHERE id = (SELECT ur.org_id FROM user_roles ur WHERE ur.user_id = $1 LIMIT 1)`,
           [userId]
         )
       }

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

     const successMessage = isPackClub
       ? 'Paiement réussi - Pack Club activé'
       : 'Paiement réussi - Compte Premium activé'

     return NextResponse.json({
       success: true,
       status: isPackClub ? 'pack_club' : 'premium',
       message: successMessage
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