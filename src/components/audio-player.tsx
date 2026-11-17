import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PlayerError } from '@/components/player-error';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Délai maximal d'attente sans réponse : chargement initial, ou déplacement dans
// le fichier (`seekTo`) qui ne se termine pas. Pas de minuteur pendant la lecture.
const LOADING_TIMEOUT_MS = 15_000;

// Saut des boutons de déplacement, en secondes.
const SKIP_SECONDS = 15;

type AudioPlayerProps = {
  // Adresse du flux ou du fichier audio.
  source: string;
  title: string;
  // Flux continu : pas de durée ni de déplacement, `currentTime` n'est pas utilisé.
  live?: boolean;
};

// Secondes -> « m:ss » ou « h:mm:ss ».
function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

// Lecteur audio au premier plan. `useAudioPlayer` libère le lecteur natif au
// démontage ; « Réessayer » du parent passe par le remontage par clé.
export function AudioPlayer({ source, title, live = false }: AudioPlayerProps) {
  const theme = useTheme();
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  // `stalled` : attente trop longue. `attempt` relance le minuteur même si l'état
  // du lecteur ne change pas d'un essai à l'autre. `seeking` : déplacement en cours.
  const [stalled, setStalled] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const hasError = Boolean(status.error) || stalled;

  // Journalise la cause d'une erreur signalée par le lecteur.
  useEffect(() => {
    if (status.error) {
      console.info(`Audio « ${title} » : erreur du lecteur`, status.error);
    }
  }, [status.error, title]);

  // Minuteur : seulement tant que le chargement initial n'est pas terminé ou
  // qu'un déplacement n'a pas reçu de réponse. Une mise en mémoire tampon pendant
  // la lecture n'est jamais traitée comme une erreur.
  useEffect(() => {
    if (hasError) return;
    if (status.isLoaded && !seeking) return;
    const timer = setTimeout(() => {
      console.info(
        `Audio « ${title} » : ${seeking ? 'déplacement' : 'chargement'} sans réponse depuis plus de ${LOADING_TIMEOUT_MS / 1000} s`,
      );
      setStalled(true);
    }, LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [hasError, status.isLoaded, seeking, attempt, title]);

  const seekTo = async (seconds: number) => {
    setSeeking(true);
    try {
      await player.seekTo(seconds);
    } catch (error) {
      console.info(`Audio « ${title} » : échec du déplacement`, error);
    } finally {
      setSeeking(false);
    }
  };

  const seekBy = (delta: number) => {
    const target = Math.min(Math.max(status.currentTime + delta, 0), status.duration);
    void seekTo(target);
  };

  // En fin de fichier le lecteur reste en pause : retour au début avant de relancer.
  const atEnd = !live && status.duration > 0 && status.currentTime >= status.duration - 0.5;

  const togglePlay = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (atEnd) await seekTo(0);
    player.play();
  };

  // Aucun rechargement automatique : on remplace la source à la demande.
  const retry = () => {
    setStalled(false);
    setSeeking(false);
    setAttempt(0);
    player.replace(source);
    player.play();
  };

  let stateLabel = 'En pause';
  if (!status.isLoaded) stateLabel = 'Chargement…';
  else if (status.isBuffering) stateLabel = 'Mise en mémoire…';
  else if (status.playing) stateLabel = 'Lecture';

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {hasError ? (
        <PlayerError compact message="Impossible de lire ce son." onRetry={retry} />
      ) : (
        <View style={[styles.panel, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small">
            {stateLabel}
            {live
              ? ' · Flux continu'
              : ` · ${formatTime(status.currentTime)} / ${formatTime(status.duration)}`}
          </ThemedText>
          <View style={styles.controls}>
            {!live && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Reculer de ${SKIP_SECONDS} secondes`}
                disabled={!status.isLoaded}
                onPress={() => seekBy(-SKIP_SECONDS)}
                style={[styles.button, !status.isLoaded && styles.disabled]}
              >
                <ThemedText type="smallBold">−{SKIP_SECONDS} s</ThemedText>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={togglePlay}
              style={[styles.button, styles.playButton]}
            >
              <ThemedText type="smallBold">{status.playing ? 'Pause' : 'Lecture'}</ThemedText>
            </Pressable>
            {!live && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Avancer de ${SKIP_SECONDS} secondes`}
                disabled={!status.isLoaded}
                onPress={() => seekBy(SKIP_SECONDS)}
                style={[styles.button, !status.isLoaded && styles.disabled]}
              >
                <ThemedText type="smallBold">+{SKIP_SECONDS} s</ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  panel: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#808080',
  },
  playButton: {
    flex: 1,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
