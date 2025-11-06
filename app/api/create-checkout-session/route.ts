// /app/api/create-checkout-session/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialiser Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 apiVersion: '2024-06-20' // Utiliser la dernière version
})

// Initialiser Supabase Admin
const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY! // Clé service pour opérations admin
)

export async function POST(request: NextRequest) {
 try {
   // Récupérer les données de la requête
   const body = await request.json()
   const {
     priceId,
     userId,
     userEmail,
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
     mode = 'payment' // Achat unique par défaut
   } = body

   // Vérifier les paramètres requis
   if (!userId || !userEmail) {
     return NextResponse.json(
       { error: 'Utilisateur non authentifié' },
       { status: 401 }
     )
   }

   // Si c'est le plan gratuit, pas besoin de Stripe
   if (!priceId) {
     // Mettre à jour l'utilisateur en gratuit dans Supabase
     const { error: updateError } = await supabaseAdmin
       .from('user_profiles')
       .upsert({
         user_id: userId,
         subscription_status: 'free',
         subscription_plan: 'gratuit',
         updated_at: new Date().toISOString()
       })

     if (updateError) {
       console.error('Erreur mise à jour profil:', updateError)
     }

     return NextResponse.json({
       success: true,
       plan: 'gratuit',
       message: 'Plan gratuit activé'
     })
   }

   // Vérifier si l'utilisateur n'est pas déjà Premium
   const { data: existingProfile } = await supabaseAdmin
     .from('user_profiles')
     .select('subscription_status, stripe_customer_id')
     .eq('user_id', userId)
     .single()

   if (existingProfile?.subscription_status === 'premium') {
     return NextResponse.json(
       { error: 'Vous êtes déjà Premium' },
       { status: 400 }
     )
   }

   // Créer ou récupérer le customer Stripe
   let customerId = existingProfile?.stripe_customer_id

   if (!customerId) {
     // Créer un nouveau customer Stripe
     const customer = await stripe.customers.create({
       email: userEmail,
       metadata: {
         supabase_user_id: userId
       }
     })
     customerId = customer.id

     // Sauvegarder le customer ID dans Supabase
     await supabaseAdmin
       .from('user_profiles')
       .upsert({
         user_id: userId,
         stripe_customer_id: customerId,
         email: userEmail,
         updated_at: new Date().toISOString()
       })
   }

   // Créer le prix Premium (4,99€ achat unique)
   // Note: En production, créer ce prix dans le Dashboard Stripe et utiliser son ID
   const price = await stripe.prices.create({
     currency: 'eur',
     unit_amount: 499, // 4,99€ en centimes
     product_data: {
       name: 'Tournoi Pétanque Premium',
       description: 'Accès à vie - Sans publicité - Support prioritaire',
       images: ['https://votre-site.com/logo-premium.png'], // Remplacer par votre logo
       metadata: {
         product_type: 'lifetime_access'
       }
     }
   })

   // URL de base pour les redirections
   const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

   // Créer la session Stripe Checkout
   const session = await stripe.checkout.sessions.create({
     customer: customerId,
     payment_method_types: ['card'],
     mode: 'payment', // Achat unique, pas subscription
     line_items: [
       {
         price: price.id,
         quantity: 1
       }
     ],
     // Métadonnées pour le webhook
     metadata: {
       user_id: userId,
       user_email: userEmail,
       product: 'premium_lifetime'
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
         message: 'Paiement unique de 4,99€ - Accès à vie'
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
     amount: '4.99€'
   })

   // Créer un enregistrement de la tentative de paiement
   await supabaseAdmin
     .from('payment_attempts')
     .insert({
       user_id: userId,
       stripe_session_id: session.id,
       amount: 499,
       currency: 'eur',
       status: 'pending',
       created_at: new Date().toISOString()
     })

   // Retourner l'ID de session pour la redirection
   return NextResponse.json({
     sessionId: session.id,
     url: session.url
   })

 } catch (error: unknown) {
   console.error('Erreur création session Stripe:', error)
   
   // Gestion des erreurs spécifiques Stripe
   if (error.type === 'StripeCardError') {
     return NextResponse.json(
       { error: 'Erreur avec la carte bancaire' },
       { status: 400 }
     )
   }
   
   if (error.type === 'StripeInvalidRequestError') {
     return NextResponse.json(
       { error: 'Configuration Stripe invalide' },
       { status: 400 }
     )
   }

   // Erreur générique
   return NextResponse.json(
     { 
       error: 'Une erreur est survenue lors de la création du paiement',
       details: error.message 
     },
     { status: 500 }
   )
 }
}

// Endpoint pour vérifier le statut de paiement
export async function GET(request: NextRequest) {
 try {
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
     const { error: updateError } = await supabaseAdmin
       .from('user_profiles')
       .update({
         subscription_status: 'premium',
         subscription_plan: 'premium_lifetime',
         premium_since: new Date().toISOString(),
         stripe_payment_intent: session.payment_intent as string,
         updated_at: new Date().toISOString()
       })
       .eq('user_id', userId)

     if (updateError) {
       console.error('Erreur mise à jour profil:', updateError)
       throw updateError
     }

     // Mettre à jour l'enregistrement de paiement
     await supabaseAdmin
       .from('payment_attempts')
       .update({
         status: 'completed',
         completed_at: new Date().toISOString()
       })
       .eq('stripe_session_id', sessionId)

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