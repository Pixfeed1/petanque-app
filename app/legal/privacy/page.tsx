// app/legal/privacy/page.tsx
// Politique de confidentialité (RGPD + Cookies) — refonte V4

'use client'

import { LegalLayout, LegalSection, Callout, LegalP, LegalList, LegalLI, LegalKV, LegalLink } from '@/components/legal'

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      pageTitle="Confidentialité"
      eyebrow="Politique de · confidentialité"
      titleStart="Comment on traite"
      titleAccent="tes données."
      intro="Pétanque Pro respecte ta vie privée et applique strictement le Règlement Général sur la Protection des Données (RGPD). Cette page explique quelles informations on collecte, pourquoi, et quels sont tes droits."
      crossLink={{ label: 'Voir les CGV', href: '/legal/terms' }}
    >
      <LegalSection num="01" title="Responsable du traitement">
        <LegalP>
          Le responsable de traitement des données collectées sur petanquepro.fr est <strong className="text-petanque-vert-fonce">PixFeed EI</strong> (Marc Gueffie), entreprise individuelle immatriculée sous le SIRET 852 393 735 00018, sise à Franconville (95130).
        </LegalP>
        <LegalKV label="Contact" value={<LegalLink href="mailto:contact@petanquepro.fr">contact@petanquepro.fr</LegalLink>} />
      </LegalSection>

      <LegalSection num="02" title="Données collectées">
        <LegalP>Pétanque Pro collecte uniquement les données strictement nécessaires au fonctionnement du service :</LegalP>
        <LegalList>
          <LegalLI><strong>Compte utilisateur</strong> : email, mot de passe chiffré, nom complet, photo de profil (optionnel)</LegalLI>
          <LegalLI><strong>Organisation</strong> : nom du club, ville, type d'organisation</LegalLI>
          <LegalLI><strong>Tournois et joueurs</strong> : noms, scores, statistiques saisies par l'utilisateur</LegalLI>
          <LegalLI><strong>Paiement</strong> : géré exclusivement par Stripe, aucune donnée bancaire n'est stockée sur nos serveurs</LegalLI>
          <LegalLI><strong>Technique</strong> : adresse IP, type de navigateur, logs de connexion (90 jours max)</LegalLI>
        </LegalList>
      </LegalSection>

      <LegalSection num="03" title="Finalités du traitement">
        <LegalList>
          <LegalLI>Création et gestion de ton compte</LegalLI>
          <LegalLI>Organisation et suivi de tes tournois</LegalLI>
          <LegalLI>Gestion des abonnements et facturation via Stripe</LegalLI>
          <LegalLI>Envoi d'emails transactionnels (confirmation, réinitialisation de mot de passe)</LegalLI>
          <LegalLI>Amélioration du service (statistiques anonymisées)</LegalLI>
          <LegalLI>Lutte contre la fraude et la sécurité du service</LegalLI>
        </LegalList>
      </LegalSection>

      <LegalSection num="04" title="Base légale">
        <LegalP>
          Le traitement de tes données repose sur trois bases légales du RGPD :
        </LegalP>
        <LegalList>
          <LegalLI><strong>L'exécution du contrat</strong> (article 6.1.b) : nécessaire pour fournir le service auquel tu as souscrit</LegalLI>
          <LegalLI><strong>Le consentement</strong> (article 6.1.a) : pour les cookies non essentiels et la newsletter</LegalLI>
          <LegalLI><strong>L'intérêt légitime</strong> (article 6.1.f) : sécurité du service et lutte contre la fraude</LegalLI>
        </LegalList>
      </LegalSection>

      <LegalSection num="05" title="Destinataires des données">
        <LegalP>Tes données ne sont jamais vendues. Elles peuvent être transmises uniquement à :</LegalP>
        <LegalList>
          <LegalLI><strong>OVH</strong> (hébergement, France) — sous-traitant technique</LegalLI>
          <LegalLI><strong>Stripe</strong> (paiement, Irlande/US) — pour le traitement des abonnements</LegalLI>
          <LegalLI>Les autorités publiques en cas de réquisition judiciaire</LegalLI>
        </LegalList>
        <Callout label="Pas de transfert hors UE">
          Hors du paiement via Stripe (qui dispose des Clauses Contractuelles Types de la Commission européenne), aucun transfert de données hors Union européenne n'est effectué.
        </Callout>
      </LegalSection>

      <LegalSection num="06" title="Durée de conservation">
        <LegalKV label="Compte actif" value="Tant que ton compte existe" />
        <LegalKV label="Compte inactif" value="Suppression automatique après 3 ans" />
        <LegalKV label="Données de facturation" value="10 ans (obligation comptable)" />
        <LegalKV label="Logs techniques" value="90 jours maximum" />
        <LegalKV label="Cookies" value="13 mois maximum" />
      </LegalSection>

      <LegalSection num="07" title="Tes droits">
        <LegalP>Conformément au RGPD, tu disposes des droits suivants :</LegalP>
        <LegalList>
          <LegalLI><strong>Droit d'accès</strong> : obtenir une copie de tes données</LegalLI>
          <LegalLI><strong>Droit de rectification</strong> : corriger des données inexactes</LegalLI>
          <LegalLI><strong>Droit à l'effacement</strong> : supprimer ton compte et tes données</LegalLI>
          <LegalLI><strong>Droit à la portabilité</strong> : récupérer tes données dans un format structuré</LegalLI>
          <LegalLI><strong>Droit d'opposition</strong> : refuser certains traitements</LegalLI>
          <LegalLI><strong>Droit à la limitation</strong> : geler temporairement un traitement</LegalLI>
        </LegalList>
        <Callout label="Comment exercer tes droits">
          Envoie un email à <LegalLink href="mailto:contact@petanquepro.fr">contact@petanquepro.fr</LegalLink> avec une copie d'une pièce d'identité. Réponse sous 30 jours maximum.
        </Callout>
        <LegalP>
          En cas de désaccord, tu peux saisir la <LegalLink href="https://www.cnil.fr/fr/plaintes" external>CNIL</LegalLink>, autorité de contrôle française.
        </LegalP>
      </LegalSection>

      <LegalSection num="08" title="Cookies et traceurs">
        <LegalP>
          Le site utilise un nombre minimal de cookies, classés en trois catégories :
        </LegalP>
        <LegalList>
          <LegalLI><strong>Cookies essentiels</strong> : authentification, session, panier. Indispensables au fonctionnement, ne nécessitent pas ton consentement.</LegalLI>
          <LegalLI><strong>Cookies de mesure d'audience</strong> : statistiques anonymisées. Soumis à consentement.</LegalLI>
          <LegalLI><strong>Cookies tiers</strong> : Stripe (paiement). Soumis à consentement.</LegalLI>
        </LegalList>
        <LegalP>
          Tu peux à tout moment modifier tes préférences cookies via le bandeau dédié ou les paramètres de ton navigateur.
        </LegalP>
      </LegalSection>

      <LegalSection num="09" title="Sécurité des données">
        <LegalP>
          Les mots de passe sont stockés avec un algorithme de hachage moderne (bcrypt). Les communications utilisent HTTPS (TLS 1.3). Les sauvegardes sont chiffrées et stockées en France. L'accès aux bases de données est restreint aux administrateurs authentifiés.
        </LegalP>
      </LegalSection>

      <LegalSection num="10" title="Modifications">
        <LegalP>
          Cette politique peut être mise à jour pour refléter une évolution légale ou un changement technique. La date de dernière mise à jour est indiquée en haut de cette page. Toute modification substantielle te sera notifiée par email.
        </LegalP>
      </LegalSection>
    </LegalLayout>
  )
}
