import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { YoutubeBridgePlayer } from '@/components/youtube-bridge-player';
import { YoutubePlayer } from '@/components/youtube-player';
import { Spacing } from '@/constants/theme';
import { useLatestVideo } from '@/hooks/use-latest-video';
import { formatDateFr } from '@/utils/format-date-fr';

// Dernière vidéo de la chaîne : chargement, erreur avec « Réessayer », ou lecteur
// accompagné du titre et de la date.
type LatestVideoProps = {
  // Appelé quand le chargement du flux se termine (succès ou erreur).
  onSettled?: () => void;
};

export function LatestVideo({ onSettled }: LatestVideoProps) {
  const { state, reload } = useLatestVideo();

  useEffect(() => {
    if (state.status !== 'loading') onSettled?.();
  }, [state.status, onSettled]);

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
  // Même titre et même date sous chacun des deux lecteurs.
  const info = (
    <View style={styles.info}>
      <ThemedText type="smallBold">{video.title}</ThemedText>
      <ThemedText type="small">{formatDateFr(new Date(video.publishedAt))}</ThemedText>
    </View>
  );
  return (
    <View>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.subtitle}>
        WebView
      </ThemedText>
      <YoutubePlayer videoId={video.id} />
      {info}
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.subtitle}>
        React Native YouTube Bridge
      </ThemedText>
      <YoutubeBridgePlayer videoId={video.id} />
      {info}
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
  subtitle: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  info: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
