import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { YoutubePlayer } from '@/components/youtube-player';
import { Spacing } from '@/constants/theme';
import { useLatestVideo } from '@/hooks/use-latest-video';
import { formatDateFr } from '@/utils/format-date-fr';

// Dernière vidéo de la chaîne : chargement, erreur avec « Réessayer », ou lecteur
// accompagné du titre et de la date.
export function LatestVideo() {
  const { state, reload } = useLatestVideo();

  if (state.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.center}>
        <ThemedText style={styles.centerText}>{state.message}</ThemedText>
        <Pressable accessibilityRole="button" onPress={reload} style={styles.button}>
          <ThemedText type="linkPrimary">Réessayer</ThemedText>
        </Pressable>
      </View>
    );
  }

  const { video } = state;
  return (
    <View>
      <YoutubePlayer videoId={video.id} />
      <View style={styles.info}>
        <ThemedText type="smallBold">{video.title}</ThemedText>
        <ThemedText type="small">{formatDateFr(new Date(video.publishedAt))}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  button: {
    padding: Spacing.two,
  },
  info: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
