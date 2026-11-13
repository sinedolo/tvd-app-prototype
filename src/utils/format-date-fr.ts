const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

// Formate une date en français (« 12 novembre 2026 »), sans `Intl` : la prise en
// charge d'`Intl` par Hermes sur Android dépend de l'appareil.
// Le flux donne des dates en UTC ; on lit jour, mois et année en heure locale de
// l'appareil (méthodes `getDate`, `getMonth`, `getFullYear`), et non en découpant
// la chaîne ISO, pour afficher le jour tel que le vit le spectateur.
export function formatDateFr(date: Date): string {
  return `${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
}
