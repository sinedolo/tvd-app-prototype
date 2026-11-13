import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LivePlayer } from '@/components/live-player';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { YoutubePlayer } from '@/components/youtube-player';
import { LATEST_VIDEO_ID } from '@/constants/latest-video';
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
          <YoutubePlayer videoId={LATEST_VIDEO_ID} />
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
