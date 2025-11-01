// /app/api/webhook-stripe/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { query } from '@/lib/db'

// Initialiser Stripe uniquement si la clé est disponible
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil'
    })
  : null

// Webhook secret depuis Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
 try {
   // Vérifier que Stripe est initialisé
   if (!stripe) {
     return NextResponse.json(
       { error: 'Stripe non configuré' },
       { status: 500 }
     )
   }

   // Récupérer le body brut pour la vérification de signature
   const body = await request.text()

   // Récupérer la signature Stripe depuis les headers
   const headersList = await headers()
   const signature = headersList.get('stripe-signature')

   if (!signature) {
     console.error('Webhook: Signature manquante')
     return NextResponse.json(
       { error: 'Signature manquante' },
       { status: 400 }
     )
   }

   // Vérifier la signature du webhook
   let event: Stripe.Event

   try {
     event = stripe.webhooks.constructEvent(
       body,
       signature,
       webhookSecret
     )
   } catch (err: any) {
     console.error('Webhook: Erreur signature:', err.message)
     return NextResponse.json(
       { error: `Webhook Error: ${err.message}` },
       { status: 400 }
     )
   }

   // Logger l'événement reçu
   console.log('Webhook reçu:', {
     type: event.type,
     id: event.id,
     created: new Date(event.created * 1000).toISOString()
   })

   // Traiter les différents types d'événements
   switch (event.type) {
     
     // ✅ PAIEMENT RÉUSSI - L'événement principal
     case 'checkout.session.completed': {
       const session = event.data.object as Stripe.Checkout.Session
       
       console.log('Paiement réussi:', {
         sessionId: session.id,
         customerEmail: session.customer_email,
         amount: session.amount_total,
         paymentStatus: session.payment_status
       })

       // Vérifier que le paiement est bien complété
       if (session.payment_status !== 'paid') {
         console.log('Paiement non complété, en attente...')
         break
       }

       // Récupérer les métadonnées
       const userId = session.metadata?.user_id
       const userEmail = session.metadata?.user_email || session.customer_email
       const product = session.metadata?.product || 'premium_lifetime'

       if (!userId) {
         console.error('User ID manquant dans les métadonnées')
         return NextResponse.json(
           { error: 'User ID manquant' },
           { status: 400 }
         )
       }

       try {
         // 1. Mettre à jour le profil utilisateur en PREMIUM
         await query(
           `UPDATE users
            SET metadata = jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    COALESCE(metadata, '{}'::jsonb),
                    '{subscription,status}',
                    '"premium"'::jsonb
                  ),
                  '{subscription,plan}',
                  $1::jsonb
                ),
                '{subscription,premium_since}',
                $2::jsonb
              ),
              '{subscription,stripe_customer_id}',
              $3::jsonb
            )
            WHERE id = $4`,
           [
             JSON.stringify(product),
             JSON.stringify(new Date().toISOString()),
             JSON.stringify(session.customer as string),
             userId
           ]
         )

         // 2. Mettre à jour l'enregistrement de paiement
         await query(
           `UPDATE payment_attempts
            SET status = $1,
                completed_at = CURRENT_TIMESTAMP,
                stripe_payment_intent = $2
            WHERE stripe_session_id = $3`,
           ['completed', session.payment_intent as string, session.id]
         )

         // 3. Note: payment_history table n'existe pas dans notre schéma
         // Si nécessaire, ajouter cette table plus tard

         // 4. Optionnel : Envoyer un email de confirmation
         // await sendConfirmationEmail(userEmail, userId)

         console.log(`✅ Utilisateur ${userId} est maintenant PREMIUM`)

       } catch (error) {
         console.error('Erreur traitement paiement:', error)
         // Ne pas retourner d'erreur pour éviter que Stripe retry
       }
       
       break
     }

     // 💳 PAIEMENT ÉCHOUÉ
     case 'checkout.session.expired':
     case 'checkout.session.async_payment_failed': {
       const session = event.data.object as Stripe.Checkout.Session
       const userId = session.metadata?.user_id

       if (userId) {
         // Mettre à jour le statut du paiement
         await query(
           `UPDATE payment_attempts
            SET status = $1,
                completed_at = CURRENT_TIMESTAMP
            WHERE stripe_session_id = $2`,
           ['failed', session.id]
         )

         console.log(`❌ Paiement échoué pour l'utilisateur ${userId}`)
       }

       break
     }

     // 💰 REMBOURSEMENT
     case 'charge.refunded': {
       const charge = event.data.object as Stripe.Charge

       // Récupérer l'utilisateur via le payment_intent
       const userResult = await query(
         `SELECT id FROM users
          WHERE metadata->'subscription'->>'stripe_payment_intent' = $1`,
         [charge.payment_intent as string]
       )

       if (userResult.rows.length > 0) {
         const userId = userResult.rows[0].id

         // Révoquer le statut Premium
         await query(
           `UPDATE users
            SET metadata = jsonb_set(
              jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{subscription,status}',
                '"free"'::jsonb
              ),
              '{subscription,refunded_at}',
              $1::jsonb
            )
            WHERE id = $2`,
           [JSON.stringify(new Date().toISOString()), userId]
         )

         console.log(`💰 Remboursement traité - Utilisateur ${userId} repassé en gratuit`)

         // Note: payment_history table n'existe pas dans notre schéma
       }

       break
     }

     // 🧾 FACTURE PAYÉE
     case 'invoice.payment_succeeded': {
       const invoice = event.data.object as Stripe.Invoice
       console.log('Facture payée:', invoice.id)
       // Peut être utilisé pour envoyer la facture par email
       break
     }

     // 👤 CLIENT CRÉÉ
     case 'customer.created': {
       const customer = event.data.object as Stripe.Customer
       const userId = customer.metadata?.user_id

       if (userId) {
         // Mettre à jour le stripe_customer_id
         await query(
           `UPDATE users
            SET metadata = jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{subscription,stripe_customer_id}',
              $1::jsonb
            )
            WHERE id = $2`,
           [JSON.stringify(customer.id), userId]
         )

         console.log(`👤 Customer Stripe créé pour l'utilisateur ${userId}`)
       }
       break
     }

     // 🔄 AUTRES ÉVÉNEMENTS
     default:
       console.log(`Événement non géré: ${event.type}`)
   }

   // Toujours retourner 200 pour confirmer la réception
   return NextResponse.json({
     received: true,
     type: event.type,
     processed: new Date().toISOString()
   })

 } catch (error: any) {
   console.error('Erreur webhook:', error)
   
   // Retourner 200 même en cas d'erreur pour éviter les retries
   return NextResponse.json({
     received: true,
     error: error.message
   })
 }
}

// Endpoint GET pour vérifier que le webhook est actif
export async function GET() {
 return NextResponse.json({
   status: 'active',
   endpoint: '/api/webhook-stripe',
   events: [
     'checkout.session.completed',
     'checkout.session.expired',
     'checkout.session.async_payment_failed',
     'charge.refunded',
     'invoice.payment_succeeded',
     'customer.created'
   ],
   timestamp: new Date().toISOString()
 })
}