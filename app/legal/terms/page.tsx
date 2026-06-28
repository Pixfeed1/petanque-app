// app/legal/terms/page.tsx
// Conditions Générales de Vente — refonte V4

'use client'

import { LegalLayout, LegalSection, Callout, LegalP, LegalList, LegalLI, LegalLink } from '@/components/legal'

export default function Terms() {
  return (
    <LegalLayout
      pageTitle="Conditions d'utilisation"
      eyebrow="CGV · Conditions générales"
      titleStart="Le contrat"
      titleAccent="entre toi et nous."
      intro="Ces Conditions Générales de Vente définissent le cadre contractuel entre PixFeed, éditeur de Pétanque Pro, et toi en tant qu'utilisateur du service. En créant un compte, tu acceptes ces conditions."
      crossLink={{ label: 'Voir la politique de confidentialité', href: '/legal/privacy' }}
    >
      <LegalSection num="01" title="Objet">
        <LegalP>
          Les présentes CGV régissent l'accès et l'utilisation de Pétanque Pro, application en ligne d'organisation de tournois de pétanque, éditée par PixFeed (SIRET 852 393 735 00018, Franconville 95130).
        </LegalP>
      </LegalSection>

      <LegalSection num="02" title="Acceptation des conditions">
        <LegalP>
          La création d'un compte sur petanquepro.fr vaut acceptation pleine et entière des présentes CGV. Si tu n'acceptes pas tout ou partie de ces conditions, tu dois renoncer à utiliser le service.
        </LegalP>
        <LegalP>
          PixFeed se réserve le droit de modifier ces CGV à tout moment. Toute modification substantielle sera notifiée par email au moins 30 jours avant son entrée en vigueur.
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

      <LegalSection num="04" title="Un service gratuit">
        <LegalP>
          Pétanque Pro est mis à disposition <strong>gratuitement</strong> et sans limitation de durée. Tournois et équipes illimités, tous les modes de jeu et toutes les options sont accessibles à chaque utilisateur, sans abonnement ni paiement.
        </LegalP>
        <Callout label="Bon à savoir">
          Aucune carte bancaire n'est demandée et aucun paiement n'est requis. L'ensemble des fonctionnalités est inclus sans frais.
        </Callout>
      </LegalSection>

      <LegalSection num="05" title="Résiliation et suspension">
        <LegalP>
          Tu peux cesser d'utiliser le service et supprimer ton compte à tout moment depuis ton espace, sans frais ni justification.
        </LegalP>
        <LegalP>
          PixFeed se réserve le droit de suspendre ou clôturer un compte en cas de manquement grave aux présentes CGV (fraude, abus, contenu illicite), après notification préalable.
        </LegalP>
      </LegalSection>

      <LegalSection num="06" title="Obligations de l'utilisateur">
        <LegalP>Tu t'engages à :</LegalP>
        <LegalList>
          <LegalLI>Fournir des informations exactes lors de l'inscription</LegalLI>
          <LegalLI>Ne pas utiliser le service à des fins illicites ou contraires aux bonnes mœurs</LegalLI>
          <LegalLI>Ne pas tenter de contourner les limitations techniques ou commerciales du service</LegalLI>
          <LegalLI>Respecter les droits des autres utilisateurs (pas de harcèlement, diffamation, etc.)</LegalLI>
          <LegalLI>Ne pas exploiter le service pour développer un produit concurrent</LegalLI>
        </LegalList>
      </LegalSection>

      <LegalSection num="07" title="Responsabilité de PixFeed">
        <LegalP>
          PixFeed s'engage à fournir le service avec diligence et selon les règles de l'art. Toutefois, la responsabilité de PixFeed ne saurait être engagée :
        </LegalP>
        <LegalList>
          <LegalLI>en cas de force majeure ou d'événement échappant à son contrôle</LegalLI>
          <LegalLI>pour les interruptions liées à la maintenance ou à l'hébergeur</LegalLI>
          <LegalLI>pour les pertes de données indirectes (chiffre d'affaires manqué, etc.)</LegalLI>
          <LegalLI>pour les contenus saisis par les utilisateurs</LegalLI>
        </LegalList>
        <LegalP>
          En tout état de cause, la responsabilité de PixFeed est limitée aux dommages directs et prévisibles, à l'exclusion de tout dommage indirect. Le service étant fourni gratuitement, il l'est en l'état, sans garantie de disponibilité ininterrompue.
        </LegalP>
      </LegalSection>

      <LegalSection num="08" title="Propriété intellectuelle">
        <LegalP>
          PixFeed conserve l'ensemble des droits de propriété intellectuelle sur Pétanque Pro (code, design, marque). Tu disposes uniquement d'un droit d'usage personnel, non exclusif et non transférable, pour la durée d'utilisation du service.
        </LegalP>
        <LegalP>
          Les contenus que tu crées (tournois, joueurs, scores) restent ta propriété. Tu accordes à PixFeed une licence limitée pour les héberger et les afficher dans le cadre du service.
        </LegalP>
      </LegalSection>

      <LegalSection num="09" title="Données personnelles">
        <LegalP>
          Le traitement de tes données personnelles est détaillé dans la <LegalLink href="/legal/privacy">politique de confidentialité</LegalLink>, partie intégrante des présentes CGV.
        </LegalP>
      </LegalSection>

      <LegalSection num="10" title="Droit applicable et médiation">
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
