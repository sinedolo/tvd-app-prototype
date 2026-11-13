import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

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
