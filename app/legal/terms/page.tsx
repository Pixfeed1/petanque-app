// app/legal/terms/page.tsx
// Conditions Générales de Vente — refonte V4

'use client'

import { LegalLayout, LegalSection, Callout, PriceCard, LegalP, LegalList, LegalLI, LegalKV, LegalLink } from '@/components/legal'

export default function Terms() {
  return (
    <LegalLayout
      pageTitle="Conditions d'utilisation"
      eyebrow="CGV · Conditions générales"
      titleStart="Le contrat"
      titleAccent="entre toi et nous."
      intro="Ces Conditions Générales de Vente définissent le cadre contractuel entre PixFeed EI, éditeur de Pétanque Pro, et toi en tant qu'utilisateur du service. En créant un compte, tu acceptes ces conditions."
      crossLink={{ label: 'Voir la politique de confidentialité', href: '/legal/privacy' }}
    >
      <LegalSection num="01" title="Objet">
        <LegalP>
          Les présentes CGV régissent l'accès et l'utilisation de Pétanque Pro, application en ligne d'organisation de tournois de pétanque, éditée par PixFeed EI (Marc Gueffie, SIRET 852 393 735 00018, Franconville 95130).
        </LegalP>
      </LegalSection>

      <LegalSection num="02" title="Acceptation des conditions">
        <LegalP>
          La création d'un compte sur petanquepro.fr vaut acceptation pleine et entière des présentes CGV. Si tu n'acceptes pas tout ou partie de ces conditions, tu dois renoncer à utiliser le service.
        </LegalP>
        <LegalP>
          PixFeed EI se réserve le droit de modifier ces CGV à tout moment. Toute modification substantielle sera notifiée par email au moins 30 jours avant son entrée en vigueur.
        </LegalP>
      </LegalSection>

      <LegalSection num="03" title="Inscription et compte utilisateur">
        <LegalP>
          L'inscription nécessite la fourniture d'une adresse email valide, d'un mot de passe et de ton nom. Tu déclares avoir au moins 18 ans ou agir avec l'autorisation d'un représentant légal.
        </LegalP>
        <LegalP>
          Tu es seul responsable de la confidentialité de tes identifiants. Tout accès non autorisé doit être signalé immédiatement à <LegalLink href="mailto:contact@petanquepro.fr">contact@petanquepro.fr</LegalLink>.
        </LegalP>
      </LegalSection>

      <LegalSection num="04" title="Offres et tarifs">
        <LegalP>
          Pétanque Pro propose trois offres complémentaires :
        </LegalP>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 mb-2">
          <PriceCard
            name="Gratuit"
            price="0 €"
            duration="Sans engagement"
            features={[
              '1 tournoi à la fois',
              '8 équipes maximum',
              'Toutes les fonctionnalités de base',
              'Accès web'
            ]}
          />
          <PriceCard
            name="Essentiel"
            price="9,99 €"
            duration="par mois · sans engagement"
            popular
            features={[
              'Tournois illimités',
              'Équipes illimitées',
              'Export PDF et Excel',
              'Historique complet',
              '<strong>Support prioritaire</strong>'
            ]}
          />
          <PriceCard
            name="Club"
            price="19,99 €"
            duration="par mois · sans engagement"
            features={[
              'Tout le plan Essentiel',
              '<strong>Personnalisation club</strong>',
              'Multi-organisateurs',
              'Statistiques avancées',
              'Page publique du club'
            ]}
          />
        </div>
        <Callout label="Bon à savoir">
          Le plan <strong>Gratuit</strong> est accessible sans limitation de durée. Tu peux passer à un plan payant à tout moment, et résilier sans frais via ton espace client.
        </Callout>
      </LegalSection>

      <LegalSection num="05" title="Paiement">
        <LegalP>
          Les paiements sont traités par <LegalLink href="https://stripe.com/fr" external>Stripe</LegalLink>, prestataire certifié PCI-DSS niveau 1. Aucune donnée bancaire n'est stockée sur les serveurs de PixFeed EI.
        </LegalP>
        <LegalKV label="Moyens acceptés" value="Carte bancaire, Apple Pay, Google Pay" />
        <LegalKV label="Devise" value="Euros (€) TTC" />
        <LegalKV label="TVA" value="Non applicable, art. 293 B du CGI" />
        <LegalKV label="Facture" value="Disponible dans l'espace client après chaque paiement" />
      </LegalSection>

      <LegalSection num="06" title="Droit de rétractation">
        <LegalP>
          Conformément aux articles L.221-18 et suivants du Code de la consommation, tu disposes d'un délai de <strong className="text-petanque-vert-fonce">14 jours</strong> à compter de la souscription pour exercer ton droit de rétractation, sans avoir à justifier de motif ni à payer de pénalités.
        </LegalP>
        <Callout label="Renonciation au droit de rétractation">
          En activant immédiatement les fonctionnalités payantes (ex : créer un second tournoi avec le plan Essentiel), tu renonces expressément à ce droit de rétractation, conformément à l'article L.221-28 13° du Code de la consommation.
        </Callout>
      </LegalSection>

      <LegalSection num="07" title="Reconduction et résiliation">
        <LegalP>
          Les abonnements payants sont mensuels et reconduits tacitement chaque mois. Tu peux les résilier à tout moment depuis ton espace client. La résiliation prend effet à la fin du mois en cours déjà payé, sans remboursement au prorata.
        </LegalP>
        <LegalP>
          PixFeed EI se réserve le droit de suspendre ou clôturer un compte en cas de manquement grave aux présentes CGV (fraude, abus, contenu illicite), après notification préalable.
        </LegalP>
      </LegalSection>

      <LegalSection num="08" title="Obligations de l'utilisateur">
        <LegalP>Tu t'engages à :</LegalP>
        <LegalList>
          <LegalLI>Fournir des informations exactes lors de l'inscription</LegalLI>
          <LegalLI>Ne pas utiliser le service à des fins illicites ou contraires aux bonnes mœurs</LegalLI>
          <LegalLI>Ne pas tenter de contourner les limitations techniques ou commerciales du service</LegalLI>
          <LegalLI>Respecter les droits des autres utilisateurs (pas de harcèlement, diffamation, etc.)</LegalLI>
          <LegalLI>Ne pas exploiter le service pour développer un produit concurrent</LegalLI>
        </LegalList>
      </LegalSection>

      <LegalSection num="09" title="Responsabilité de PixFeed EI">
        <LegalP>
          PixFeed EI s'engage à fournir le service avec diligence et selon les règles de l'art. Toutefois, la responsabilité de PixFeed EI ne saurait être engagée :
        </LegalP>
        <LegalList>
          <LegalLI>en cas de force majeure ou d'événement échappant à son contrôle</LegalLI>
          <LegalLI>pour les interruptions liées à la maintenance ou à l'hébergeur</LegalLI>
          <LegalLI>pour les pertes de données indirectes (chiffre d'affaires manqué, etc.)</LegalLI>
          <LegalLI>pour les contenus saisis par les utilisateurs</LegalLI>
        </LegalList>
        <LegalP>
          En tout état de cause, la responsabilité de PixFeed EI est plafonnée au montant des sommes versées par l'utilisateur au cours des 12 derniers mois.
        </LegalP>
      </LegalSection>

      <LegalSection num="10" title="Propriété intellectuelle">
        <LegalP>
          PixFeed EI conserve l'ensemble des droits de propriété intellectuelle sur Pétanque Pro (code, design, marque). Tu disposes uniquement d'un droit d'usage personnel, non exclusif et non transférable, pour la durée de ton abonnement.
        </LegalP>
        <LegalP>
          Les contenus que tu crées (tournois, joueurs, scores) restent ta propriété. Tu accordes à PixFeed EI une licence limitée pour les héberger et les afficher dans le cadre du service.
        </LegalP>
      </LegalSection>

      <LegalSection num="11" title="Données personnelles">
        <LegalP>
          Le traitement de tes données personnelles est détaillé dans la <LegalLink href="/legal/privacy">politique de confidentialité</LegalLink>, partie intégrante des présentes CGV.
        </LegalP>
      </LegalSection>

      <LegalSection num="12" title="Droit applicable et médiation">
        <LegalP>
          Les présentes CGV sont régies par le droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.
        </LegalP>
        <Callout label="Médiation conso">
          Conformément à l'article L.612-1 du Code de la consommation, tu peux recourir gratuitement à la <LegalLink href="https://ec.europa.eu/consumers/odr" external>plateforme européenne de règlement en ligne des litiges</LegalLink>.
        </Callout>
        <LegalP>
          À défaut, les juridictions françaises seront seules compétentes, sauf disposition légale contraire impérative.
        </LegalP>
      </LegalSection>
    </LegalLayout>
  )
}
