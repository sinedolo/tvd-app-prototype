import {
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer as ExpoAudioPlayer,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { usePlaybackCoordinator } from '@/components/playback-coordinator';
import { PlayerError } from '@/components/player-error';
import { ThemedText } from '@/components/themed-text';
import { NOTIFICATION_ARTIST } from '@/constants/notification';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Délai maximal d'attente sans réponse : chargement initial, ou déplacement dans
// le fichier (`seekTo`) qui ne se termine pas. Pas de minuteur pendant la lecture.
const LOADING_TIMEOUT_MS = 15_000;

// Saut des boutons de déplacement, en secondes.
const SKIP_SECONDS = 15;

// Flux continu : délai au-delà duquel une relance au direct non confirmée est
// abandonnée (son rétabli). À ajuster après essais.
const RELOAD_CONFIRM_TIMEOUT_MS = 5_000;

// Coupe ou rétablit le son. Hors du composant : le React Compiler interdit de
// modifier dans le composant l'objet renvoyé par un hook.
function setMuted(player: ExpoAudioPlayer, muted: boolean) {
  player.muted = muted;
}

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

// Lecteur audio, qui continue en arrière-plan (mode audio réglé à la racine par le
// coordinateur). `useAudioPlayer` libère le lecteur natif au démontage ;
// « Réessayer » du parent passe par le remontage par clé.
export function AudioPlayer({ source, title, live = false }: AudioPlayerProps) {
  const theme = useTheme();
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  // Lecteur actuellement affiché sur l'écran verrouillé (et dans la notification).
  // Sur Android, cette activation est nécessaire pour que la lecture en arrière-plan
  // dure plus de quelques minutes.
  const lockScreenActive = useRef(false);

  const releaseLockScreen = useCallback(() => {
    if (!lockScreenActive.current) return;
    lockScreenActive.current = false;
    player.clearLockScreenControls();
  }, [player]);

  // Démarrage détecté sur l'état du lecteur (bouton de l'application ou commandes
  // de l'écran verrouillé) : les autres lecteurs se mettent en pause et rendent la
  // notification ; celui-ci la prend, avec le titre du bloc, le nom de la chaîne
  // et sans image.
  const notifyStarted = usePlaybackCoordinator({
    pause: () => player.pause(),
    deactivate: releaseLockScreen,
  });
  // Flux continu (`live`) : après une pause, Lecture reprendrait là où le flux
  // s'était arrêté (en différé). On relance donc la source pour revenir au direct.
  // expo-audio (SDK 58) n'offre pas de retour au direct : mécanisme à remplacer si
  // une version future en propose un.
  // - `pausedSinceStart` : une pause a eu lieu depuis le dernier démarrage. Le son
  //   est coupé dès la pause : la reprise part en natif avant que ce code ne
  //   réagisse, l'ancien son reste ainsi inaudible jusqu'à la relance.
  // - `reloading` : relance en cours ; ses changements d'état ne comptent ni comme
  //   une pause ni comme un démarrage (pas de seconde mise en pause des autres).
  // - `sawUnload` : la nouvelle source a commencé à charger (`isLoaded` à false).
  // - `reloadTimer` : sécurité, si la relance n'est jamais confirmée.
  const pausedSinceStart = useRef(false);
  const reloading = useRef(false);
  const sawUnload = useRef(false);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fin de relance (confirmée, en erreur ou abandonnée) : son rétabli.
  const endReload = useCallback(() => {
    if (reloadTimer.current !== null) {
      clearTimeout(reloadTimer.current);
      reloadTimer.current = null;
    }
    reloading.current = false;
    sawUnload.current = false;
    setMuted(player, false);
  }, [player]);

  // Au démontage, aucun minuteur ne doit survivre.
  useEffect(
    () => () => {
      if (reloadTimer.current !== null) clearTimeout(reloadTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (reloading.current) return;
    if (!status.playing) {
      // Pause après un démarrage (une coupure réseau ne passe pas ici : pendant
      // une mise en mémoire tampon, expo-audio garde `playing` à true ; une erreur
      // est traitée par « Réessayer »).
      if (live && lockScreenActive.current && !status.error) {
        pausedSinceStart.current = true;
        setMuted(player, true);
      }
      return;
    }
    notifyStarted();
    if (!lockScreenActive.current) {
      lockScreenActive.current = true;
      player.setActiveForLockScreen(
        true,
        { title, artist: NOTIFICATION_ARTIST },
        { isLiveStream: live },
      );
    }
    if (!live || !pausedSinceStart.current) return;
    pausedSinceStart.current = false;
    reloading.current = true;
    sawUnload.current = false;
    console.info(`Audio « ${title} » : reprise après une pause, relance au direct`);
    reloadTimer.current = setTimeout(() => {
      reloadTimer.current = null;
      if (!reloading.current) return;
      console.info(`Audio « ${title} » : relance non confirmée, son rétabli`);
      endReload();
    }, RELOAD_CONFIRM_TIMEOUT_MS);
    player.replace(source);
    player.play();
  }, [status.playing, status.error, notifyStarted, player, title, live, source, endReload]);

  // Relance confirmée : la nouvelle source a quitté puis retrouvé l'état chargé.
  useEffect(() => {
    if (!reloading.current) return;
    if (!status.isLoaded) {
      sawUnload.current = true;
      return;
    }
    if (sawUnload.current) endReload();
  }, [status.isLoaded, endReload]);

  // Au démontage (tirer vers le bas, « Réessayer » du parent), la notification
  // d'un lecteur actif est libérée explicitement. `useAudioPlayer` ne libère le
  // lecteur natif qu'après ces nettoyages : l'appel reste possible ici.
  useEffect(
    () => () => {
      try {
        releaseLockScreen();
      } catch (error) {
        console.info(`Audio « ${title} » : échec de la libération de la notification`, error);
      }
    },
    [releaseLockScreen, title],
  );

  // `stalled` : attente trop longue. `attempt` relance le minuteur même si l'état
  // du lecteur ne change pas d'un essai à l'autre. `seeking` : déplacement en cours.
  const [stalled, setStalled] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const hasError = Boolean(status.error) || stalled;

  // Journalise la cause d'une erreur signalée par le lecteur. Une relance au direct
  // en échec (erreur ou attente trop longue) se termine ici : son rétabli, puis
  // message d'erreur et « Réessayer ».
  useEffect(() => {
    if (status.error) {
      console.info(`Audio « ${title} » : erreur du lecteur`, status.error);
    }
    if (hasError && reloading.current) endReload();
  }, [status.error, hasError, title, endReload]);

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
  // Le démarrage qui suit passe par le chemin normal (un seul `notifyStarted`).
  const retry = () => {
    setStalled(false);
    setSeeking(false);
    setAttempt(0);
    pausedSinceStart.current = false;
    endReload();
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
