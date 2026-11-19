import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { YoutubeBridgePlayer } from '@/components/youtube-bridge-player';
import { Spacing } from '@/constants/theme';
import { YOUTUBE_RADIO_CHANNEL_ID } from '@/constants/youtube-feed';
import { useLatestVideo } from '@/hooks/use-latest-video';
import { formatDateFr } from '@/utils/format-date-fr';

// Dernière vidéo de la chaîne radio : chargement, erreur avec « Réessayer », ou
// lecteur (react-native-youtube-bridge) accompagné du titre et de la date.
// Son propre appel du hook : états et flux indépendants du bloc « Dernière vidéo ».
export function LatestPodcastVideo() {
  const { state, reload } = useLatestVideo(YOUTUBE_RADIO_CHANNEL_ID);

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
      <YoutubeBridgePlayer videoId={video.id} />
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
