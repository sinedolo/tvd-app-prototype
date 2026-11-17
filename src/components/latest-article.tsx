import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useLatestArticle } from '@/hooks/use-latest-article';
import { formatDateFr } from '@/utils/format-date-fr';
import { isTrustedUrl } from '@/utils/trusted-url';

// Ouvre la page de l'article dans le navigateur intégré (onglet Chrome sur Android).
async function openArticle(url: string) {
  if (!isTrustedUrl(url)) {
    console.info('Adresse refusée (pas en HTTPS sur tvdecouverte.ch) :', url);
    return;
  }
  try {
    // Android : `createTask: false` ouvre l'onglet dans la même tâche que
    // l'application. Par défaut (`createTask: true` avec `useProxyActivity`), il
    // s'ouvre dans une tâche séparée, visible dans les récents, et la croix ne
    // ramenait pas à l'application dans Expo Go (constaté le 17.11.2026).
    // Source : docs.expo.dev/versions/v58.0.0/sdk/webbrowser, consultée le 17.11.2026.
    // Contrepartie : l'onglet peut se fermer si l'application passe en arrière-plan.
    await WebBrowser.openBrowserAsync(url, { createTask: false });
  } catch (error) {
    console.info('Ouverture de l’article impossible', error);
  }
}

// Ouvre le PDF par le système. Un seul endroit à changer si les tests montrent que
// `WebBrowser.openBrowserAsync` convient mieux.
async function openPdf(url: string) {
  if (!isTrustedUrl(url)) {
    console.info('Adresse refusée (pas en HTTPS sur tvdecouverte.ch) :', url);
    return;
  }
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.info('Ouverture du PDF impossible', error);
  }
}

type LatestArticleProps = {
  // Appelé quand le chargement de l'article se termine (succès ou erreur).
  onSettled?: () => void;
};

// Dernier article du magazine : chargement, erreur avec « Réessayer », ou aperçu
// (image, titre, date, extrait) avec les boutons « Lire l'article » et, si trouvé,
// « Lire le PDF ».
export function LatestArticle({ onSettled }: LatestArticleProps) {
  const { state, reload } = useLatestArticle();

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

  const { article, pdfUrl } = state;
  return (
    <View>
      {article.image && (
        <Image
          source={{ uri: article.image.url }}
          style={[styles.image, { aspectRatio: article.image.width / article.image.height }]}
          resizeMode="cover"
          accessible={article.image.alt !== ''}
          accessibilityLabel={article.image.alt || undefined}
        />
      )}
      <View style={styles.info}>
        <ThemedText type="smallBold">{article.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDateFr(new Date(article.publishedAt))}
        </ThemedText>
        {article.excerpt !== '' && (
          <ThemedText type="small" numberOfLines={5}>
            {article.excerpt}
          </ThemedText>
        )}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Lire l’article : ${article.title}`}
            onPress={() => openArticle(article.link)}
            style={styles.button}
          >
            <ThemedText type="linkPrimary">Lire l&apos;article</ThemedText>
          </Pressable>
          {pdfUrl && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Lire le PDF : ${article.title}`}
              onPress={() => openPdf(pdfUrl)}
              style={styles.button}
            >
              <ThemedText type="linkPrimary">Lire le PDF</ThemedText>
            </Pressable>
          )}
        </View>
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
  image: {
    width: '100%',
  },
  info: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  button: {
    padding: Spacing.two,
  },
});
