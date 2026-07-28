// app/legal/suppression-compte/page.tsx
// Page publique de demande de suppression de compte (exigence Google Play Data Safety).
// Doit rester accessible SANS être connecté : c'est l'URL déclarée dans le Play Console.

'use client'

import { LegalLayout, LegalSection, Callout, LegalP, LegalList, LegalLI, LegalLink } from '@/components/legal'

export default function SuppressionCompte() {
  return (
    <LegalLayout
      pageTitle="Suppression de compte"
      eyebrow="Tes données · ton contrôle"
      titleStart="Supprimer ton compte"
      titleAccent="et tes données."
      intro="Tu peux supprimer ton compte Pétanque Pro à tout moment, directement depuis l'application ou en nous écrivant. Cette page explique comment faire et quelles données sont effacées."
      crossLink={{ label: 'Voir la politique de confidentialité', href: '/legal/privacy' }}
    >
      <LegalSection num="01" title="Supprimer depuis l'application (recommandé)">
        <LegalP>La façon la plus rapide, en quelques secondes :</LegalP>
        <LegalList>
          <LegalLI>Connecte-toi sur <LegalLink href="https://petanquepro.fr/login">petanquepro.fr</LegalLink></LegalLI>
          <LegalLI>Va dans <strong>Paramètres</strong> (icône profil en haut à droite)</LegalLI>
          <LegalLI>En bas de la page, section <strong>« Fermer ton compte »</strong></LegalLI>
          <LegalLI>Tape <strong>SUPPRIMER</strong> pour confirmer, puis valide</LegalLI>
        </LegalList>
        <LegalP>La suppression est <strong>immédiate et définitive</strong>.</LegalP>
      </LegalSection>

      <LegalSection num="02" title="Supprimer par email">
        <LegalP>
          Tu n'as plus accès à ton compte ? Écris-nous depuis l'adresse email associée à ton compte à{' '}
          <LegalLink href="mailto:hello@petanquepro.fr?subject=Suppression%20de%20mon%20compte">hello@petanquepro.fr</LegalLink>{' '}
          avec pour objet « Suppression de mon compte ». Nous traitons la demande sous <strong>30 jours</strong> maximum.
        </LegalP>
      </LegalSection>

      <LegalSection num="03" title="Ce qui est supprimé">
        <LegalList>
          <LegalLI><strong>Ton compte</strong> : email, nom, mot de passe, photo de profil</LegalLI>
          <LegalLI><strong>Tes abonnements aux notifications</strong> et jetons associés</LegalLI>
          <LegalLI><strong>Tes clubs personnels</strong> (dont tu es le seul membre), avec leurs tournois, équipes, matchs et joueurs</LegalLI>
          <LegalLI><strong>L'historique de tes paiements</strong> (les reçus légaux Stripe restent soumis aux obligations comptables)</LegalLI>
        </LegalList>
        <Callout>
          Si tu partages un club avec d'autres organisateurs, le club et ses tournois sont conservés pour les autres membres :
          on retire seulement ton accès et on anonymise tes contributions (avis, retours).
        </Callout>
      </LegalSection>

      <LegalSection num="04" title="Délais et conservation">
        <LegalP>
          Les données personnelles sont effacées immédiatement lors d'une suppression depuis l'application. Certaines données
          peuvent être conservées un temps limité lorsque la loi l'impose (obligations comptables et fiscales pour les factures,
          logs de sécurité anti-fraude conservés au maximum 90 jours). Passé ces délais légaux, elles sont définitivement supprimées.
        </LegalP>
      </LegalSection>

      <LegalSection num="05" title="Une question ?">
        <LegalP>
          Pour toute question sur tes données ou l'exercice de tes droits (accès, rectification, portabilité, suppression),
          contacte-nous à <LegalLink href="mailto:hello@petanquepro.fr">hello@petanquepro.fr</LegalLink>.
        </LegalP>
      </LegalSection>
    </LegalLayout>
  )
}
