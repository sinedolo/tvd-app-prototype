import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AudioPlayer } from '@/components/audio-player';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useLatestPodcast } from '@/hooks/use-latest-podcast';
import { formatDateFr } from '@/utils/format-date-fr';

// Dernier podcast du site : chargement, erreur avec « Réessayer », ou titre et date
// de l'épisode suivis du lecteur (ou d'un message si aucun MP3 n'a été trouvé).
export function LatestPodcast() {
  const { state, reload } = useLatestPodcast();

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

  const { episode, audioUrl } = state;
  const date = (
    <ThemedText type="small" themeColor="textSecondary">
      {formatDateFr(new Date(episode.publishedAt))}
    </ThemedText>
  );

  // Avec un MP3, `AudioPlayer` affiche déjà le titre : on ne met que la date, juste
  // au-dessus. Sans MP3, le titre est affiché ici, suivi de la date et du message.
  if (audioUrl) {
    return (
      <View>
        <View style={styles.dateOnly}>{date}</View>
        <AudioPlayer source={audioUrl} title={episode.title} />
      </View>
    );
  }

  return (
    <View style={styles.info}>
      <ThemedText type="smallBold">{episode.title}</ThemedText>
      {date}
      <ThemedText type="small">Aucun fichier audio trouvé pour le dernier épisode</ThemedText>
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
  dateOnly: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
  },
  info: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  button: {
    padding: Spacing.two,
  },
});
