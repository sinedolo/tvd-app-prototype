import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LatestVideo } from '@/components/latest-video';
import { LivePlayer } from '@/components/live-player';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// `SafeAreaView` ajoute une marge pour éviter la barre d'état et l'encoche ;
// `ScrollView` permet de faire défiler la page si le contenu dépasse l'écran.
export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView>
          <ThemedText type="subtitle" style={styles.title}>
            TV&nbsp;Découverte en direct
          </ThemedText>
          <LivePlayer />
          <ThemedText type="subtitle" style={styles.title}>
            Dernière vidéo
          </ThemedText>
          <LatestVideo />
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
