import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type PlayerErrorProps = {
  message: string;
  onRetry: () => void;
};

// Zone d'erreur d'un lecteur YouTube : message court et « Réessayer », sur le
// même cadre 16/9 noir que le lecteur qu'elle remplace.
export function PlayerError({ message, onRetry }: PlayerErrorProps) {
  return (
    <View style={styles.container}>
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
