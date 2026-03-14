// app/legal/privacy/page.tsx
// Politique de confidentialité (inclut RGPD + Cookies)

'use client'

import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/footer'

export default function PrivacyPolicy() {
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
            Politique de confidentialité
          </h1>
          <p className="text-xl text-green-100">
            Protection de vos données personnelles et utilisation des cookies
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">

          {/* Introduction */}
          <section className="mb-10">
            <div className="bg-green-50 rounded-lg p-6 mb-8">
              <p className="text-gray-700">
                Chez <strong>Pétanque Pro</strong>, la protection de vos données personnelles est une priorité.
                Cette politique explique comment nous collectons, utilisons et protégeons vos informations
                conformément au Règlement Général sur la Protection des Données (RGPD).
              </p>
            </div>
          </section>

          {/* Responsable de traitement */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              1. Responsable du traitement des données
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Raison sociale :</strong> Pixfeed</p>
              <p><strong>Email :</strong> <a href="mailto:privacy@petanquepro.fr" className="text-green-600 hover:text-green-700">privacy@petanquepro.fr</a></p>
              <p><strong>Délégué à la Protection des Données (DPO) :</strong> contact@petanquepro.fr</p>
            </div>
          </section>

          {/* Données collectées */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              2. Données collectées
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Données d'inscription</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Nom et prénom</li>
                  <li>Adresse email</li>
                  <li>Mot de passe (hashé et sécurisé)</li>
                  <li>Sexe (optionnel, pour répartition équipes H/F)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Données de navigation</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Adresse IP</li>
                  <li>Type de navigateur</li>
                  <li>Pages consultées et durée de visite</li>
                  <li>Cookies (détaillés ci-dessous)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Données d'utilisation</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Tournois créés</li>
                  <li>Joueurs enregistrés</li>
                  <li>Statistiques des matchs</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Finalités */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              3. Finalités du traitement
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>Nous utilisons vos données uniquement pour :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Créer et gérer votre compte utilisateur</li>
                <li>Permettre l'organisation et le suivi de vos tournois</li>
                <li>Envoyer des notifications importantes (réinitialisation mot de passe, etc.)</li>
                <li>Améliorer nos services et l'expérience utilisateur</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </div>
          </section>

          {/* Base légale */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              4. Base légale
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>Le traitement de vos données repose sur :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Votre consentement</strong> lors de la création de votre compte</li>
                <li><strong>L'exécution du contrat</strong> (fourniture des services Pétanque Pro)</li>
                <li><strong>Nos intérêts légitimes</strong> (amélioration de nos services)</li>
                <li><strong>Obligations légales</strong> (conservation des données pour obligations comptables)</li>
              </ul>
            </div>
          </section>

          {/* Durée de conservation */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              5. Durée de conservation
            </h2>
            <div className="space-y-4 text-gray-700">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Compte actif :</strong> Tant que votre compte existe</li>
                <li><strong>Compte supprimé :</strong> 30 jours (possibilité de récupération)</li>
                <li><strong>Données de paiement :</strong> 10 ans (obligations légales comptables)</li>
                <li><strong>Cookies :</strong> Maximum 13 mois</li>
              </ul>
            </div>
          </section>

          {/* Vos droits RGPD */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              6. Vos droits (RGPD)
            </h2>
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 font-medium mb-4">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">✓</span>
                  <span><strong>Droit d'accès :</strong> Obtenir une copie de vos données</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">✓</span>
                  <span><strong>Droit de rectification :</strong> Corriger vos données inexactes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">✓</span>
                  <span><strong>Droit à l'effacement :</strong> Supprimer vos données ("droit à l'oubli")</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">✓</span>
                  <span><strong>Droit à la portabilité :</strong> Récupérer vos données dans un format structuré</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">✓</span>
                  <span><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">✓</span>
                  <span><strong>Droit de limitation :</strong> Limiter le traitement de vos données</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 rounded-lg p-6">
              <p className="text-gray-700">
                <strong>Pour exercer vos droits :</strong><br />
                Envoyez-nous un email à{' '}
                <a href="mailto:privacy@petanquepro.fr" className="text-green-600 hover:text-green-700 font-medium">
                  privacy@petanquepro.fr
                </a>
                {' '}avec une copie de votre pièce d'identité. Nous vous répondrons sous 30 jours.
              </p>
              <p className="text-gray-700 mt-4">
                <strong>Réclamation :</strong> Vous pouvez également déposer une plainte auprès de la{' '}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  CNIL
                </a>.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              7. Politique des cookies
            </h2>

            <div className="space-y-6">
              <div className="bg-yellow-50 rounded-lg p-6">
                <p className="text-gray-700">
                  Un cookie est un petit fichier texte stocké sur votre appareil lors de la visite d'un site web.
                  Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation du site.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Types de cookies utilisés</h3>

                <div className="space-y-4">
                  <div className="border-l-4 border-green-600 pl-4">
                    <h4 className="font-semibold text-gray-900">Cookies essentiels (obligatoires)</h4>
                    <p className="text-gray-700 mt-2">
                      Nécessaires au fonctionnement du site. Ils permettent la connexion, la navigation sécurisée
                      et la gestion de votre session. Ces cookies ne peuvent pas être désactivés.
                    </p>
                    <p className="text-sm text-gray-600 mt-2"><strong>Durée :</strong> Session</p>
                  </div>

                  <div className="border-l-4 border-blue-600 pl-4">
                    <h4 className="font-semibold text-gray-900">Cookies analytiques (optionnels)</h4>
                    <p className="text-gray-700 mt-2">
                      Nous aident à comprendre comment vous utilisez le site (pages visitées, temps passé, etc.)
                      pour améliorer nos services.
                    </p>
                    <p className="text-sm text-gray-600 mt-2"><strong>Durée :</strong> 13 mois</p>
                  </div>

                  <div className="border-l-4 border-orange-600 pl-4">
                    <h4 className="font-semibold text-gray-900">Cookies fonctionnels (optionnels)</h4>
                    <p className="text-gray-700 mt-2">
                      Utilisés pour mémoriser vos préférences et personnaliser votre expérience.
                    </p>
                    <p className="text-sm text-gray-600 mt-2"><strong>Durée :</strong> 13 mois</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Gérer vos cookies</h3>
                <p className="text-gray-700 mb-4">
                  Vous pouvez à tout moment accepter ou refuser les cookies via :
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Le bandeau cookies affiché lors de votre première visite</li>
                  <li>Les paramètres de votre navigateur</li>
                  <li>Les paramètres de votre compte dans l'application</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Partage des données */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              8. Partage de vos données
            </h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>Nous ne vendons JAMAIS vos données.</strong></p>
              <p>Vos données peuvent être partagées uniquement avec :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Hébergeur :</strong> Pour le stockage sécurisé des données</li>
                <li><strong>Processeur de paiement :</strong> Stripe (pour les abonnements Essentiel et Club)</li>
                <li><strong>Services analytiques :</strong> Google Analytics (si vous acceptez les cookies analytiques)</li>
                <li><strong>Autorités légales :</strong> Si requis par la loi</li>
              </ul>
              <p className="mt-4">
                Tous nos prestataires sont conformes au RGPD et situés dans l'Union Européenne ou disposent
                de mécanismes de transfert appropriés.
              </p>
            </div>
          </section>

          {/* Sécurité */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              9. Sécurité des données
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chiffrement SSL/TLS (HTTPS) pour toutes les communications</li>
                <li>Hashage des mots de passe (bcrypt)</li>
                <li>Sauvegardes régulières et chiffrées</li>
                <li>Accès restreint aux données (principe du moindre privilège)</li>
                <li>Surveillance et mises à jour de sécurité régulières</li>
              </ul>
            </div>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              10. Modifications de cette politique
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Nous pouvons modifier cette politique de confidentialité à tout moment. Toute modification
                substantielle vous sera notifiée par email et/ou via un avertissement sur le site.
              </p>
              <p>
                Nous vous encourageons à consulter régulièrement cette page pour rester informé de nos pratiques.
              </p>
            </div>
          </section>

          {/* Contact */}
          <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Des questions ?</h3>
            <p className="text-gray-700">
              Pour toute question concernant vos données personnelles, contactez-nous à{' '}
              <a href="mailto:privacy@petanquepro.fr" className="text-green-600 hover:text-green-700 font-medium">
                privacy@petanquepro.fr
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
