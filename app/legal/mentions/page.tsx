// app/legal/mentions/page.tsx
// Mentions légales

'use client'

import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/footer'

export default function MentionsLegales() {
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
            Mentions légales
          </h1>
          <p className="text-xl text-green-100">
            Informations légales sur l'éditeur et l'hébergeur du site
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Éditeur */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              Éditeur du site
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Raison sociale :</strong> Pixfeed</p>
              <p><strong>Adresse :</strong> 1 Rue des Morillons, 95130 Franconville La Garenne</p>
              <p><strong>SIRET :</strong> 852 393 735 00018</p>
              <p><strong>Email :</strong> <a href="mailto:contact@petanquepro.fr" className="text-green-600 hover:text-green-700">contact@petanquepro.fr</a></p>
              <p><strong>Téléphone :</strong> 09 54 32 02 85</p>
              <p><strong>Directeur de publication :</strong> Michael Vaertan</p>
            </div>
          </section>

          {/* Hébergeur */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              Hébergeur du site
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Raison sociale :</strong> Ex2.com</p>
              <p><strong>Adresse :</strong> CP 70161 Québec STN Québec-Centre, G2K 0A2 Québec, Canada</p>
              <p><strong>Site web :</strong> <a href="https://www.ex2.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">www.ex2.com</a></p>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              Propriété intellectuelle
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                L'ensemble du contenu du site Pétanque Pro (textes, images, logos, icônes, vidéos, etc.)
                est la propriété exclusive de Pixfeed, sauf mention contraire.
              </p>
              <p>
                Toute reproduction, distribution, modification ou utilisation à des fins commerciales
                sans autorisation écrite préalable est strictement interdite.
              </p>
            </div>
          </section>

          {/* Responsabilité */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              Limitation de responsabilité
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Pixfeed met tout en œuvre pour offrir aux utilisateurs des informations et outils fiables.
                Toutefois, Pixfeed ne peut être tenu responsable des erreurs, d'une absence de disponibilité
                des informations ou de la présence de virus sur son site.
              </p>
              <p>
                Les informations fournies le sont à titre indicatif et ne sauraient dispenser l'utilisateur
                d'une analyse complémentaire et personnalisée.
              </p>
            </div>
          </section>

          {/* Médiation */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-600">
              Médiation
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Conformément à l'article L.612-1 du Code de la consommation, nous proposons un dispositif
                de médiation de la consommation.
              </p>
              <p>
                <strong>L'entité de médiation retenue est :</strong> Médiateur du e-commerce de la FEVAD<br />
                <strong>Adresse :</strong> 60 rue La Boétie, 75008 Paris<br />
                <strong>Site web :</strong> <a href="https://www.mediateurfevad.fr" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">www.mediateurfevad.fr</a>
              </p>
              <p className="text-sm text-gray-500">
                Avant de saisir le médiateur, vous devez avoir préalablement tenté de résoudre votre litige
                directement auprès de notre service client par une réclamation écrite.
              </p>
            </div>
          </section>

          {/* Dernière mise à jour */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Dernière mise à jour : 29 novembre 2025
            </p>
          </div>
        </div>
      </div>

      <Footer scrollToSection={scrollToSection} />
    </div>
  )
}
