// /app/api/webhook-stripe/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Initialiser Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 apiVersion: '2024-06-20'
})

// Initialiser Supabase Admin
const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook secret depuis Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
 try {
   // Récupérer le body brut pour la vérification de signature
   const body = await request.text()
   
   // Récupérer la signature Stripe depuis les headers
   const signature = headers().get('stripe-signature')

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
         const { error: profileError } = await supabaseAdmin
           .from('user_profiles')
           .upsert({
             user_id: userId,
             email: userEmail,
             subscription_status: 'premium',
             subscription_plan: product,
             premium_since: new Date().toISOString(),
             stripe_customer_id: session.customer as string,
             stripe_payment_intent: session.payment_intent as string,
             stripe_session_id: session.id,
             updated_at: new Date().toISOString()
           })

         if (profileError) {
           console.error('Erreur mise à jour profil:', profileError)
           throw profileError
         }

         // 2. Mettre à jour l'enregistrement de paiement
         const { error: paymentError } = await supabaseAdmin
           .from('payment_attempts')
           .update({
             status: 'completed',
             completed_at: new Date().toISOString(),
             stripe_payment_intent: session.payment_intent as string
           })
           .eq('stripe_session_id', session.id)

         if (paymentError) {
           console.error('Erreur mise à jour paiement:', paymentError)
         }

         // 3. Créer un enregistrement dans l'historique des transactions
         const { error: historyError } = await supabaseAdmin
           .from('payment_history')
           .insert({
             user_id: userId,
             stripe_session_id: session.id,
             stripe_payment_intent: session.payment_intent as string,
             amount: session.amount_total, // En centimes
             currency: session.currency,
             status: 'success',
             product_type: product,
             invoice_url: session.invoice as string,
             receipt_url: session.url,
             created_at: new Date().toISOString()
           })

         if (historyError) {
           console.error('Erreur création historique:', historyError)
         }

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
         await supabaseAdmin
           .from('payment_attempts')
           .update({
             status: 'failed',
             completed_at: new Date().toISOString()
           })
           .eq('stripe_session_id', session.id)

         console.log(`❌ Paiement échoué pour l'utilisateur ${userId}`)
       }
       
       break
     }

     // 💰 REMBOURSEMENT
     case 'charge.refunded': {
       const charge = event.data.object as Stripe.Charge
       
       // Récupérer l'utilisateur via le payment_intent
       const { data: profile } = await supabaseAdmin
         .from('user_profiles')
         .select('user_id')
         .eq('stripe_payment_intent', charge.payment_intent as string)
         .single()

       if (profile) {
         // Révoquer le statut Premium
         const { error } = await supabaseAdmin
           .from('user_profiles')
           .update({
             subscription_status: 'free',
             subscription_plan: null,
             premium_since: null,
             refunded_at: new Date().toISOString(),
             updated_at: new Date().toISOString()
           })
           .eq('user_id', profile.user_id)

         if (!error) {
           console.log(`💰 Remboursement traité - Utilisateur ${profile.user_id} repassé en gratuit`)
         }

         // Enregistrer le remboursement
         await supabaseAdmin
           .from('payment_history')
           .insert({
             user_id: profile.user_id,
             stripe_payment_intent: charge.payment_intent as string,
             amount: -charge.amount_refunded, // Négatif pour remboursement
             currency: charge.currency,
             status: 'refunded',
             product_type: 'refund',
             created_at: new Date().toISOString()
           })
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
       const userId = customer.metadata?.supabase_user_id

       if (userId) {
         // Mettre à jour le stripe_customer_id
         await supabaseAdmin
           .from('user_profiles')
           .update({
             stripe_customer_id: customer.id,
             updated_at: new Date().toISOString()
           })
           .eq('user_id', userId)

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