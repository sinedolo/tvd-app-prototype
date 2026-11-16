import Constants from 'expo-constants';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { PlayerError } from '@/components/player-error';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type YoutubePlayerProps = {
  videoId: string;
};

// Lecteur intégré de YouTube dans une WebView. YouTube exige un en-tête `Referer`
// (erreur 153 sinon) : on le construit à partir de l'identifiant Android déclaré
// dans `app.json`, lu par `expo-constants`. Aucun script n'est injecté et rien ne
// recouvre le lecteur : ses commandes restent celles de YouTube.
export function YoutubePlayer({ videoId }: YoutubePlayerProps) {
  const appId = Constants.expoConfig?.android?.package;
  // Réessayer = remonter la WebView en changeant la `key`.
  const [attempt, setAttempt] = useState(0);

  // Pas de valeur de repli inventée : sans identifiant, on ne charge rien.
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
    <WebViewPlayerInner
      key={attempt}
      videoId={videoId}
      appId={appId}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}

type InnerProps = YoutubePlayerProps & { appId: string; onRetry: () => void };

function WebViewPlayerInner({ videoId, appId, onRetry }: InnerProps) {
  const [failed, setFailed] = useState(false);

  // Sans ce remplacement, la WebView affiche sa page d'erreur native (en anglais).
  if (failed) {
    return (
      <PlayerError
        message="Lecture impossible. Vérifiez la connexion puis réessayez."
        onRetry={onRetry}
      />
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{
          uri: `https://www.youtube.com/embed/${videoId}?playsinline=1`,
          headers: { Referer: `https://${appId}` },
        }}
        style={styles.webview}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction
        // Échec de chargement de la page (réseau coupé, DNS…).
        onError={(event) => {
          const { code, description } = event.nativeEvent;
          console.info('Lecteur WebView : échec du chargement', code, description);
          setFailed(true);
        }}
        // Réponse HTTP d'erreur : journalisée seulement. L'événement peut aussi
        // venir d'une sous-ressource ; on n'affiche pas d'erreur sur cette base.
        onHttpError={(event) => {
          const { statusCode, description } = event.nativeEvent;
          console.info('Lecteur WebView : erreur HTTP', statusCode, description);
        }}
        // Processus de rendu tué ou planté par Android.
        onRenderProcessGone={(event) => {
          console.info('Lecteur WebView : processus de rendu arrêté', event.nativeEvent.didCrash);
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  message: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  // Fond toujours sombre : texte blanc dans les deux thèmes.
  messageText: {
    color: '#ffffff',
    textAlign: 'center',
  },
});
