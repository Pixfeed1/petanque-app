'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '../../components/footer'
import { Petanque, Check, Shield, Info, Star, Warning } from '@/components/Icons'

// Icônes professionnelles
const Icons = {
  logo: <Petanque className="w-10 h-10" />,
  document: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  check: <Check className="w-5 h-5" />,
  shield: <Shield className="w-6 h-6" />,
  info: <Info className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
  warning: <Warning className="w-6 h-6" />,
  euro: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  copyright: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function TermsPage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const sections = [
    {
      id: 'presentation',
      title: '1. Présentation du service',
      icon: Icons.info,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            <strong>Pétanque Pro</strong> est une application web de gestion de tournois de pétanque,
            éditée par <strong>Pixfeed</strong>, dont le siège social est situé en France.
          </p>
          <p className="text-gray-700">
            L'application est accessible à l'adresse <a href="https://petanquepro.fr" className="text-green-600 hover:underline">https://petanquepro.fr</a>
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Contact :</strong> support@petanquepro.fr
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'objet',
      title: '2. Objet',
      icon: Icons.document,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Les présentes Conditions Générales de Vente (CGV) ont pour objet de définir les modalités
            et conditions dans lesquelles <strong>Pétanque Pro</strong> fournit ses services aux utilisateurs.
          </p>
          <p className="text-gray-700">
            Elles sont accessibles à tout moment sur l'application et prévaudront sur toute autre version
            ou tout autre document contradictoire.
          </p>
        </div>
      )
    },
    {
      id: 'acceptation',
      title: '3. Acceptation des CGV',
      icon: Icons.check,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            L'utilisation de l'application <strong>Pétanque Pro</strong> implique l'acceptation pleine
            et entière des présentes CGV.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Lors de votre inscription, vous devez accepter explicitement les CGV</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Toute utilisation de l'application vaut acceptation des CGV en vigueur</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Nous nous réservons le droit de modifier les CGV à tout moment</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'inscription',
      title: '4. Inscription et compte utilisateur',
      icon: Icons.shield,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Pour utiliser Pétanque Pro, vous devez créer un compte en fournissant des informations exactes :
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Adresse email valide</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Mot de passe sécurisé</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Nom et informations de profil</span>
            </li>
          </ul>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important :</strong> Vous êtes responsable de la confidentialité de vos identifiants.
              Toute connexion à votre compte sera présumée avoir été effectuée par vous.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'tarifs',
      title: '5. Tarifs et modalités de paiement',
      icon: Icons.euro,
      content: (
        <div className="space-y-6">
          <p className="text-gray-700">
            Pétanque Pro propose deux formules :
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-3">Version Gratuite</h4>
              <div className="text-3xl font-bold text-gray-900 mb-2">0€</div>
              <p className="text-gray-600 mb-4">Avec publicités non intrusives</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span>Toutes les fonctionnalités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span>Tournois illimités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span>Support par email</span>
                </li>
              </ul>
            </div>

            <div className="border-2 border-green-400 rounded-lg p-6 bg-gradient-to-br from-green-50 to-emerald-50 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                POPULAIRE
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Version Premium</h4>
              <div className="text-3xl font-bold text-green-600 mb-2">4,99€</div>
              <p className="text-gray-600 mb-4">Abonnement annuel renouvelable</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span>Toutes les fonctionnalités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span><strong>Sans publicité</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span>Support prioritaire</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-gray-900">Modalités de paiement :</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                <span>Paiements sécurisés via <strong>Stripe</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                <span>Cartes bancaires : Visa, Mastercard, American Express</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                <span>Renouvellement automatique annuel (résiliable à tout moment)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                <span>Facture envoyée automatiquement par email</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'resiliation',
      title: '6. Durée, renouvellement et résiliation',
      icon: Icons.calendar,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            <strong>Version Gratuite :</strong> Accessible sans limitation de durée.
            Vous pouvez supprimer votre compte à tout moment depuis les paramètres.
          </p>
          <p className="text-gray-700">
            <strong>Version Premium :</strong>
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Durée d'engagement : 1 an à compter du paiement</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Renouvellement automatique annuel au même tarif</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Résiliation possible à tout moment depuis votre espace client Stripe</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>En cas de résiliation, l'accès Premium reste actif jusqu'à la fin de la période payée</span>
            </li>
          </ul>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Aucun remboursement au prorata n'est effectué en cas de résiliation
              en cours d'abonnement.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'retractation',
      title: '7. Droit de rétractation',
      icon: Icons.warning,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai
            de <strong>14 jours</strong> à compter de la souscription pour exercer votre droit de rétractation,
            sans avoir à justifier de motifs ni à payer de pénalités.
          </p>
          <p className="text-gray-700">
            Pour exercer ce droit, contactez-nous à : <a href="mailto:support@petanquepro.fr" className="text-green-600 hover:underline">support@petanquepro.fr</a>
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>Exception :</strong> Si vous avez expressément demandé à bénéficier du service
              avant la fin du délai de rétractation, ce droit ne s'applique plus après utilisation complète du service.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'propriete',
      title: '8. Propriété intellectuelle',
      icon: Icons.copyright,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            L'ensemble des éléments de l'application Pétanque Pro (design, logo, textes, images, code source)
            est la propriété exclusive de <strong>Pixfeed</strong> et est protégé par le droit de la propriété intellectuelle.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Toute reproduction, représentation, modification ou adaptation est interdite sans autorisation</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Les données que vous créez (tournois, joueurs, etc.) vous appartiennent</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Vous pouvez exporter vos données à tout moment</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'responsabilite',
      title: '9. Responsabilités et garanties',
      icon: Icons.shield,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            <strong>Pétanque Pro</strong> s'engage à :
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Fournir un service accessible 24/7 avec un taux de disponibilité optimal</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Assurer la sécurité et la confidentialité de vos données</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Corriger les bugs et dysfonctionnements dans les meilleurs délais</span>
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            <strong>Limitations de responsabilité :</strong>
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-gray-500 mr-2 mt-1">•</span>
              <span>Nous ne pouvons être tenus responsables des interruptions temporaires de service</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-500 mr-2 mt-1">•</span>
              <span>Nous ne sommes pas responsables de l'usage que vous faites de l'application</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-500 mr-2 mt-1">•</span>
              <span>Vous êtes responsable de la sauvegarde de vos données</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'donnees',
      title: '10. Protection des données personnelles',
      icon: Icons.shield,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Vos données personnelles sont collectées et traitées conformément au RGPD et à notre
            <a href="/legal/rgpd" className="text-green-600 hover:underline ml-1">Politique de Confidentialité</a>.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Données hébergées en Europe (conformité RGPD)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Droit d'accès, de rectification et de suppression de vos données</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Aucune revente de vos données à des tiers</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Sécurisation par chiffrement (SSL/TLS)</span>
            </li>
          </ul>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              Pour toute demande concernant vos données personnelles, contactez :
              <a href="mailto:support@petanquepro.fr" className="font-medium hover:underline ml-1">support@petanquepro.fr</a>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'loi',
      title: '11. Loi applicable et juridiction',
      icon: Icons.info,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Les présentes CGV sont soumises au <strong>droit français</strong>.
          </p>
          <p className="text-gray-700">
            En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.
            À défaut, les tribunaux français seront seuls compétents.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-800">
              <strong>Médiation :</strong> Conformément à l'article L612-1 du Code de la consommation,
              vous pouvez recourir gratuitement à un médiateur de la consommation en cas de litige.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'modifications',
      title: '12. Modifications des CGV',
      icon: Icons.calendar,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Nous nous réservons le droit de modifier les présentes CGV à tout moment.
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>Vous serez informé par email de toute modification substantielle</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>La date de dernière mise à jour est indiquée en haut de cette page</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
              <span>La poursuite de l'utilisation après modification vaut acceptation des nouvelles CGV</span>
            </li>
          </ul>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 cursor-pointer"
            >
              {Icons.logo}
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Pétanque Pro
              </span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6">
            {Icons.document}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Conditions Générales de Vente
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conditions d'utilisation et de vente de l'application Pétanque Pro.
            Veuillez lire attentivement ces conditions avant d'utiliser nos services.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-green-600 mr-3">{section.icon}</span>
                {section.title}
              </h2>
              {section.content}
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Des questions sur nos CGV ?
            </h2>
            <p className="mb-6">
              Notre équipe est à votre disposition pour répondre à toutes vos questions
              concernant les conditions de vente ou l'utilisation de Pétanque Pro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:support@petanquepro.fr"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                support@petanquepro.fr
              </a>
              <button
                onClick={() => router.push('/legal/rgpd')}
                className="inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white/10 transition font-medium"
              >
                Politique de confidentialité
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
