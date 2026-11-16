import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { YoutubeView, useYouTubeEvent, useYouTubePlayer } from 'react-native-youtube-bridge';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type YoutubeBridgePlayerProps = {
  videoId: string;
};

// Lecteur basé sur react-native-youtube-bridge, mode HTML inline. YouTube exige
// que le lecteur intégré identifie l'application (erreur 153 sinon) : on règle
// l'origine et l'URL de base du HTML sur `https://<identifiant Android>`, lu
// dans `app.json` par `expo-constants`, comme dans `youtube-player.tsx`.
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
  const [errorCode, setErrorCode] = useState<number | null>(null);

  useYouTubeEvent(player, 'error', (error) => {
    setErrorCode(error.code);
  });

  if (errorCode !== null) {
    return (
      <View style={[styles.container, styles.message]}>
        <ThemedText style={styles.messageText}>
          Lecture impossible (code {errorCode}). Vérifiez la connexion puis réessayez.
        </ThemedText>
        <Pressable onPress={onRetry} style={styles.button} accessibilityRole="button">
          <ThemedText style={styles.messageText}>Réessayer</ThemedText>
        </Pressable>
      </View>
    );
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
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 8,
  },
});
