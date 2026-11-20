import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView, type VideoPlayer, type VideoSource } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { usePlaybackCoordinator } from '@/components/playback-coordinator';
import { ThemedText } from '@/components/themed-text';
import { LIVE_STREAM_URL } from '@/constants/live-stream';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// `contentType: 'hls'` indique au lecteur le format du flux. `metadata` : texte de
// la notification, le titre du bloc de l'accueil (aucune image distante).
const LIVE_SOURCE: VideoSource = {
  uri: LIVE_STREAM_URL,
  contentType: 'hls',
  metadata: { title: 'TV Découverte en direct' },
};

// Affiche ou retire la notification du direct (et ses commandes d'écran verrouillé).
// Hors du composant : le React Compiler interdit de modifier dans le composant
// l'objet renvoyé par un hook.
function setNowPlayingNotification(player: VideoPlayer, show: boolean) {
  player.showNowPlayingNotification = show;
}

// Durée maximale d'un chargement continu (`loading`) avant d'afficher l'erreur.
const LOADING_TIMEOUT_MS = 15_000;

// Lecteur du direct : commandes natives et plein écran. Pas de lecture
// automatique : le son ne démarre qu'à l'appui sur Lecture.
export function LivePlayer() {
  const theme = useTheme();
  // Le son continue en arrière-plan (écran éteint, autre application) ; la vidéo
  // n'est plus affichée. Exige `supportsBackgroundPlayback` dans `app.json`.
  const player = useVideoPlayer(LIVE_SOURCE, (p) => {
    p.staysActiveInBackground = true;
  });

  // Le démarrage est détecté sur l'état du lecteur (et non sur un bouton), donc
  // aussi quand il vient des commandes natives. Les autres lecteurs se mettent en
  // pause ; le direct prend la notification, qu'il rend quand un autre démarre.
  const notifyStarted = usePlaybackCoordinator({
    pause: () => player.pause(),
    deactivate: () => setNowPlayingNotification(player, false),
  });
  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (!isPlaying) return;
    notifyStarted();
    setNowPlayingNotification(player, true);
  });

  // `useEvent` renvoie la dernière valeur de l'événement et relance le rendu
  // à chaque changement ; la valeur initiale est le statut courant du lecteur.
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  // `stalled` : le chargement dure trop longtemps. Compteur d'essais : il relance
  // le minuteur même si le statut reste `loading` d'un essai à l'autre.
  const [stalled, setStalled] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Journalise la cause d'une erreur ; tout changement de statut annule le blocage.
  useEventListener(player, 'statusChange', ({ status: newStatus, error }) => {
    setStalled(false);
    if (newStatus === 'error') {
      console.info('Direct : erreur du lecteur', error?.message);
    }
  });

  // Une coupure en cours d'usage fait repasser ExoPlayer en `loading` (mise en
  // mémoire tampon) sans erreur : après le délai, on bascule dans l'état d'erreur.
  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => {
      console.info(`Direct : chargement bloqué depuis plus de ${LOADING_TIMEOUT_MS / 1000} s`);
      setStalled(true);
    }, LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, attempt]);

  // Aucun rechargement automatique après une erreur : on remplace la source.
  const retry = async () => {
    setStalled(false);
    setAttempt((n) => n + 1);
    await player.replaceAsync(LIVE_SOURCE);
    player.play();
  };

  const hasError = status === 'error' || stalled;
  const isLoading = !hasError && (status === 'idle' || status === 'loading');

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
      {hasError && (
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
