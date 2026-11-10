import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

// Mise en page racine : elle enveloppe tous les écrans de l'application.
// Le `Stack` est une pile de navigation : chaque écran s'empile sur le précédent.
// L'en-tête est masqué : chaque écran gère lui-même ses zones sûres.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
