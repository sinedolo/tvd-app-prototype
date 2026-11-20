import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  PlayerState,
  YoutubeView,
  useYouTubeEvent,
  useYouTubePlayer,
} from 'react-native-youtube-bridge';

import { PlayerError } from '@/components/player-error';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

// Durée maximale d'une mise en mémoire tampon continue avant d'afficher l'erreur.
// Une mise en mémoire tampon normale dure quelques secondes ; 15 s laisse de la
// marge aux réseaux faibles sans laisser un chargement sans fin. À ajuster après essais.
const BUFFERING_TIMEOUT_MS = 15_000;

type YoutubeBridgePlayerProps = {
  videoId: string;
};

// Lecteur basé sur react-native-youtube-bridge, mode HTML inline. YouTube exige
// que le lecteur intégré identifie l'application (erreur 153 sinon) : on règle
// l'origine et l'URL de base du HTML sur `https://<identifiant Android>`, lu
// dans `app.json` par `expo-constants`.
export function YoutubeBridgePlayer({ videoId }: YoutubeBridgePlayerProps) {
  const appId = Constants.expoConfig?.android?.package;
  // Réessayer = remonter tout le lecteur en changeant la `key` : cela recrée
  // le hook et la WebView, ce que `loadVideoById` ne ferait pas si l'API
  // YouTube n'a pas pu se charger (erreur 1003).
  const [attempt, setAttempt] = useState(0);

  // Pas de valeur de repli inventée : sans identifiant, on ne charge rien.
  // (Le test précède le composant intérieur : un hook ne peut pas être conditionnel.)
  if (!appId) {
    return (
      <View style={[styles.container, styles.message]}>
        <ThemedText style={styles.messageText}>
          Développement : identifiant de l&apos;application introuvable (android.package), vidéo non
          chargée.
        </ThemedText>
      </View>
    );
  }

  return (
    <BridgePlayerInner
      key={attempt}
      videoId={videoId}
      appUrl={`https://${appId}`}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}

type InnerProps = YoutubeBridgePlayerProps & { appUrl: string; onRetry: () => void };

function BridgePlayerInner({ videoId, appUrl, onRetry }: InnerProps) {
  // `origin` sans barre finale ; la bibliothèque ajoute la barre à `webViewUrl`
  // (utilisé comme `baseUrl` du HTML en mode inline).
  const player = useYouTubePlayer(videoId, { playsinline: true, controls: true, origin: appUrl });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Minuteur de la mise en mémoire tampon (BUFFERING) en cours, s'il y en a un.
  const bufferingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBufferingTimer = useCallback(() => {
    if (bufferingTimer.current !== null) {
      clearTimeout(bufferingTimer.current);
      bufferingTimer.current = null;
    }
  }, []);

  // Au démontage (dont le « Réessayer » par `key`), aucun minuteur ne doit survivre.
  useEffect(() => clearBufferingTimer, [clearBufferingTimer]);

  useYouTubeEvent(player, 'error', (error) => {
    console.info('Lecteur YouTube Bridge : erreur du lecteur', error.code);
    clearBufferingTimer();
    setErrorMessage(
      `Lecture impossible (code ${error.code}). Vérifiez la connexion puis réessayez.`,
    );
  });

  // Un minuteur n'existe que pendant BUFFERING ; tout autre état l'annule, donc
  // aucun délai pendant la lecture normale. Si BUFFERING dure trop (coupure en
  // cours d'usage : le lecteur n'émet alors aucun événement `error`), on passe en erreur.
  useYouTubeEvent(player, 'stateChange', (state) => {
    clearBufferingTimer();
    if (state !== PlayerState.BUFFERING) return;
    bufferingTimer.current = setTimeout(() => {
      bufferingTimer.current = null;
      console.info(
        `Lecteur YouTube Bridge : chargement bloqué depuis plus de ${BUFFERING_TIMEOUT_MS / 1000} s`,
      );
      setErrorMessage('Lecture interrompue. Vérifiez la connexion puis réessayez.');
    }, BUFFERING_TIMEOUT_MS);
  });

  if (errorMessage !== null) {
    return <PlayerError message={errorMessage} onRetry={onRetry} />;
  }

  return (
    <View style={styles.container}>
      <YoutubeView player={player} width="100%" height="100%" webViewUrl={appUrl} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
  },
  message: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  // Fond toujours sombre : texte blanc dans les deux thèmes.
  messageText: {
    color: '#ffffff',
    textAlign: 'center',
  },
});
