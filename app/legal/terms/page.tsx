// app/legal/terms/page.tsx
// Conditions d'utilisation (CGU)

'use client'

import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/footer'

export default function TermsOfService() {
  const scrollToSection = (sectionId: string) => {
    window.location.href = `/#${sectionId}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Conditions d'utilisation
          </h1>
          <p className="text-xl text-green-100">
            Règles d'usage et conditions générales du service
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">

          {/* Acceptation */}
          <section className="mb-10">
            <div className="bg-green-50 rounded-lg p-6 mb-8">
              <p className="text-gray-700">
                En accédant et en utilisant <strong>Pétanque Pro</strong>, vous acceptez d'être lié par
                les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez
                ne pas utiliser nos services.
              </p>
            </div>
          </section>

          {/* Objet */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              1. Objet
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités
                et conditions d'utilisation des services proposés par Pétanque Pro, ainsi que les droits et
                obligations des parties dans ce cadre.
              </p>
              <p>
                Pétanque Pro est une application web permettant d'organiser et de gérer des tournois de pétanque.
              </p>
            </div>
          </section>

          {/* Accès au service */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              2. Accès au service
            </h2>
            <div className="space-y-4 text-gray-700">
              <h3 className="font-semibold text-gray-900">2.1 Inscription</h3>
              <p>
                L'utilisation de Pétanque Pro nécessite la création d'un compte utilisateur. Vous vous engagez à :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fournir des informations exactes et à jour</li>
                <li>Maintenir la sécurité de votre mot de passe</li>
                <li>Ne pas partager votre compte avec des tiers</li>
                <li>Nous informer immédiatement de toute utilisation non autorisée</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-6">2.2 Disponibilité</h3>
              <p>
                Nous nous efforçons de maintenir l'accès au service 24h/24 et 7j/7. Toutefois, nous ne pouvons
                garantir une disponibilité absolue et nous nous réservons le droit d'interrompre temporairement
                l'accès pour des raisons de maintenance ou de force majeure.
              </p>
            </div>
          </section>

          {/* Formules */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              3. Formules d'abonnement
            </h2>
            <div className="space-y-4 text-gray-700">
              <h3 className="font-semibold text-gray-900">3.1 Version gratuite</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Accès à toutes les fonctionnalités</li>
                <li>Tournois illimités</li>
                <li>Affichage de publicités non intrusives</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-6">3.2 Version Premium</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Paiement unique de 4,99€ TTC</li>
                <li>Accès à vie sans publicité</li>
                <li>Toutes les fonctionnalités incluses</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-6">3.3 Paiement</h3>
              <p>
                Les paiements sont traités de manière sécurisée par Stripe. Nous ne conservons aucune donnée
                de carte bancaire. Conformément à la loi, vous disposez d'un droit de rétractation de 14 jours
                à compter de l'achat.
              </p>
            </div>
          </section>

          {/* Utilisation acceptable */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              4. Utilisation acceptable
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>Vous vous engagez à ne pas :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Utiliser le service à des fins illégales ou non autorisées</li>
                <li>Tenter d'accéder de manière non autorisée au système ou aux données</li>
                <li>Interférer avec le bon fonctionnement du service</li>
                <li>Transmettre des virus, malwares ou tout code malveillant</li>
                <li>Collecter des données personnelles d'autres utilisateurs</li>
                <li>Usurper l'identité d'une autre personne</li>
                <li>Utiliser des robots ou scripts automatisés sans autorisation</li>
                <li>Harceler, menacer ou diffamer d'autres utilisateurs</li>
              </ul>
              <div className="bg-red-50 rounded-lg p-4 mt-4">
                <p className="text-red-700 font-medium">
                  ⚠️ Toute violation de ces règles peut entraîner la suspension immédiate de votre compte
                  et des poursuites judiciaires si nécessaire.
                </p>
              </div>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              5. Propriété intellectuelle
            </h2>
            <div className="space-y-4 text-gray-700">
              <h3 className="font-semibold text-gray-900">5.1 Droits de Pétanque Pro</h3>
              <p>
                Tous les éléments du service (code source, design, logos, textes, etc.) sont protégés par
                le droit d'auteur et restent la propriété exclusive de Pixfeed.
              </p>

              <h3 className="font-semibold text-gray-900 mt-6">5.2 Vos données</h3>
              <p>
                Vous conservez la propriété de toutes les données que vous créez dans l'application
                (tournois, joueurs, résultats). Vous nous accordez une licence non exclusive pour
                stocker et traiter ces données afin de fournir le service.
              </p>

              <h3 className="font-semibold text-gray-900 mt-6">5.3 Export de données</h3>
              <p>
                Vous pouvez à tout moment exporter vos données au format PDF. En cas de fermeture de votre
                compte, vos données seront définitivement supprimées après 30 jours.
              </p>
            </div>
          </section>

          {/* Responsabilité */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              6. Limitation de responsabilité
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Pétanque Pro est fourni "en l'état" sans garantie d'aucune sorte. Nous nous efforçons de fournir
                un service fiable, mais nous ne pouvons garantir :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>L'absence d'erreurs ou de bugs</li>
                <li>La disponibilité continue et ininterrompue</li>
                <li>La compatibilité avec tous les appareils</li>
              </ul>
              <p className="mt-4">
                Notre responsabilité est limitée au montant que vous avez payé pour le service au cours
                des 12 derniers mois. Nous ne sommes pas responsables des dommages indirects ou consécutifs.
              </p>
            </div>
          </section>

          {/* Résiliation */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              7. Résiliation
            </h2>
            <div className="space-y-4 text-gray-700">
              <h3 className="font-semibold text-gray-900">7.1 Par vous</h3>
              <p>
                Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil.
                Vos données seront conservées 30 jours puis définitivement supprimées.
              </p>

              <h3 className="font-semibold text-gray-900 mt-6">7.2 Par nous</h3>
              <p>
                Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violation des présentes conditions d'utilisation</li>
                <li>Activité frauduleuse ou illégale</li>
                <li>Non-paiement (si applicable)</li>
                <li>Inactivité prolongée (plus de 2 ans)</li>
              </ul>
            </div>
          </section>

          {/* Modifications */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              8. Modifications des conditions
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications
                substantielles vous seront notifiées par email et/ou via le site.
              </p>
              <p>
                En continuant à utiliser le service après notification des modifications, vous acceptez
                les nouvelles conditions.
              </p>
            </div>
          </section>

          {/* Droit applicable */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              9. Droit applicable et juridiction
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Les présentes conditions sont régies par le droit français. En cas de litige, une solution
                amiable sera recherchée avant toute action judiciaire.
              </p>
              <p>
                À défaut, les tribunaux français seront seuls compétents.
              </p>
            </div>
          </section>

          {/* Contact */}
          <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Des questions ?</h3>
            <p className="text-gray-700">
              Pour toute question concernant ces conditions d'utilisation, contactez-nous à{' '}
              <a href="mailto:support@petanquepro.fr" className="text-green-600 hover:text-green-700 font-medium">
                support@petanquepro.fr
              </a>
            </p>
          </div>

          {/* Dernière mise à jour */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Dernière mise à jour : 13 novembre 2025
            </p>
          </div>
        </div>
      </div>

      <Footer scrollToSection={scrollToSection} />
    </div>
  )
}
