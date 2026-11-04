import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Abonnement à une source qui ne change jamais : React exige cette fonction,
// mais il n'y a rien à écouter. Elle renvoie une fonction de désabonnement vide.
const subscribe = () => () => {};

// Valeur lue par le rendu côté client une fois l'application interactive :
// l'hydratation est faite.
const getSnapshot = () => true;

// Valeur lue par le rendu côté serveur et pendant l'hydratation, c'est-à-dire
// tant que le JavaScript n'a pas pris la main sur le HTML déjà généré. Elle doit
// donner le même résultat que le serveur, sinon React signale un écart.
const getServerSnapshot = () => false;

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
