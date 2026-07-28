// app/legal/mentions/page.tsx
// Mentions légales — refonte V4

'use client'

import { LegalLayout, LegalSection, Callout, LegalP, LegalList, LegalLI, LegalKV, LegalLink } from '@/components/legal'

export default function MentionsLegales() {
  return (
    <LegalLayout
      pageTitle="Mentions légales"
      eyebrow="Mentions · légales"
      titleStart="Qui édite"
      titleAccent="Pétanque Pro."
      intro="Conformément à la loi pour la confiance dans l'économie numérique (LCEN), voici les informations légales relatives à l'éditeur, à l'hébergeur et aux conditions d'utilisation du site petanquepro.fr."
      crossLink={{ label: 'Voir les CGV', href: '/legal/terms' }}
    >
      <LegalSection num="01" title="Éditeur du site">
        <LegalKV label="Raison sociale" value="PixFeed" />
        <LegalKV label="Forme juridique" value="Entreprise individuelle (micro-entrepreneur)" />
        <LegalKV label="SIRET" value="852 393 735 00018" />
        <LegalKV label="Directeur de la publication" value="PixFeed" />
        <LegalKV label="Adresse" value="Franconville (95130), France" />
        <LegalKV label="E-mail" value={<LegalLink href="mailto:hello@petanquepro.fr">hello@petanquepro.fr</LegalLink>} />
        <LegalKV label="TVA" value="Non applicable, art. 293 B du CGI (franchise en base)" />
      </LegalSection>

      <LegalSection num="02" title="Hébergement">
        <LegalP>
          Le site petanquepro.fr est hébergé sur un serveur dédié géré par <LegalLink href="https://www.ovhcloud.com/fr/" external>OVH SAS</LegalLink>, 2 rue Kellermann, 59100 Roubaix, France.
        </LegalP>
        <Callout label="Localisation des données">
          Les données traitées par Pétanque Pro sont stockées exclusivement sur des serveurs situés dans l'Union européenne (Roubaix, France).
        </Callout>
      </LegalSection>

      <LegalSection num="03" title="Propriété intellectuelle">
        <LegalP>
          L'ensemble du site (textes, illustrations, identité visuelle, code source, marque « Pétanque Pro ») est protégé par le droit français de la propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable de PixFeed est interdite.
        </LegalP>
        <LegalP>
          Les marques et logos cités (OVH, etc.) demeurent la propriété de leurs détenteurs respectifs.
        </LegalP>
      </LegalSection>

      <LegalSection num="04" title="Limitation de responsabilité">
        <LegalP>
          PixFeed met tout en œuvre pour garantir la fiabilité et la disponibilité du service. Toutefois, l'éditeur ne saurait être tenu responsable :
        </LegalP>
        <LegalList>
          <LegalLI>des interruptions temporaires liées à la maintenance ou aux opérations de l'hébergeur</LegalLI>
          <LegalLI>des conséquences d'une mauvaise utilisation du service par un utilisateur</LegalLI>
          <LegalLI>des contenus saisis par les utilisateurs (noms d'équipes, résultats, etc.)</LegalLI>
        </LegalList>
      </LegalSection>

      <LegalSection num="05" title="Médiation de la consommation">
        <LegalP>
          Conformément à l'article L.612-1 du Code de la consommation, en cas de litige non résolu à l'amiable, vous pouvez recourir gratuitement au médiateur de la consommation référencé par PixFeed :
        </LegalP>
        <Callout label="Médiateur conso">
          Plateforme européenne de règlement en ligne des litiges (RLL) : <LegalLink href="https://ec.europa.eu/consumers/odr" external>ec.europa.eu/consumers/odr</LegalLink>
        </Callout>
      </LegalSection>
    </LegalLayout>
  )
}
