import { useEvent } from 'expo';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LIVE_STREAM_URL } from '@/constants/live-stream';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// `contentType: 'hls'` indique au lecteur le format du flux.
const LIVE_SOURCE: VideoSource = { uri: LIVE_STREAM_URL, contentType: 'hls' };

// Lecteur du direct : lecture automatique, commandes natives et plein écran.
export function LivePlayer() {
  const theme = useTheme();
  const player = useVideoPlayer(LIVE_SOURCE, (p) => {
    p.play();
  });

  // `useEvent` renvoie la dernière valeur de l'événement et relance le rendu
  // à chaque changement ; la valeur initiale est le statut courant du lecteur.
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  // Aucun rechargement automatique après une erreur : on remplace la source.
  const retry = async () => {
    await player.replaceAsync(LIVE_SOURCE);
    player.play();
  };

  const isLoading = status === 'idle' || status === 'loading';

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
      />
      {isLoading && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator color="#ffffff" />
          <ThemedText style={styles.overlayText}>Chargement du direct…</ThemedText>
        </View>
      )}
      {status === 'error' && (
        <View style={styles.overlay}>
          <ThemedText style={styles.overlayText}>Impossible de lire le direct.</ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={retry}
            style={[styles.button, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText type="smallBold">Réessayer</ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  // Le fond de la superposition est toujours sombre : texte blanc dans les deux thèmes.
  overlayText: {
    color: '#ffffff',
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
});
