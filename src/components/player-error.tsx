import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type PlayerErrorProps = {
  message: string;
  onRetry: () => void;
  // Lecteur audio : cadre de hauteur réduite au lieu du 16/9.
  compact?: boolean;
};

// Zone d'erreur d'un lecteur : message court et « Réessayer », sur le même cadre
// 16/9 noir que le lecteur vidéo qu'elle remplace (ou compacte pour l'audio).
export function PlayerError({ message, onRetry, compact = false }: PlayerErrorProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <ThemedText style={styles.text}>{message}</ThemedText>
      <Pressable onPress={onRetry} style={styles.button} accessibilityRole="button">
        <ThemedText style={styles.text}>Réessayer</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  compact: {
    aspectRatio: undefined,
  },
  // Fond toujours sombre : texte blanc dans les deux thèmes.
  text: {
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
