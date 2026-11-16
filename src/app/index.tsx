import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LatestVideo } from '@/components/latest-video';
import { LivePlayer } from '@/components/live-player';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// Durée maximale de l'indicateur de rafraîchissement : filet de sécurité si la fin
// du chargement du flux n'est jamais signalée.
const REFRESH_TIMEOUT_MS = 15_000;

// `SafeAreaView` ajoute une marge pour éviter la barre d'état et l'encoche ;
// `ScrollView` permet de faire défiler la page si le contenu dépasse l'écran.
export default function HomeScreen() {
  // Tirer vers le bas change `refreshKey` : les composants portant cette `key`
  // sont remontés, donc le direct, le flux et les deux lecteurs YouTube repartent
  // de zéro (y compris depuis un état d'erreur).
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshKey((n) => n + 1);
  };

  // Le flux signale la fin de son chargement ; le minuteur masque l'indicateur
  // si ce signal n'arrive pas.
  const onSettled = useCallback(() => setRefreshing(false), []);
  useEffect(() => {
    if (!refreshing) return;
    const timer = setTimeout(() => setRefreshing(false), REFRESH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [refreshing]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <ThemedText type="subtitle" style={styles.title}>
            TV&nbsp;Découverte en direct
          </ThemedText>
          <LivePlayer key={`live-${refreshKey}`} />
          <ThemedText type="subtitle" style={styles.title}>
            Dernière vidéo
          </ThemedText>
          <LatestVideo key={`latest-${refreshKey}`} onSettled={onSettled} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    padding: Spacing.three,
  },
});
