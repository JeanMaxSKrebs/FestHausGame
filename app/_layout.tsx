import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthUserProvider } from '../context/AuthUserProvider';
import { WhatsAppBridge } from '../game/WhatsAppBridge';

// Suppress MetaMask web3 injection errors on web platform
if (Platform.OS === 'web') {
  if (typeof window !== 'undefined') {
    const originalError = console.error;

    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';

      if (message.includes('MetaMask') || message.includes('Failed to connect')) {
        return;
      }

      originalError?.(...args);
    };
  }
}

export const unstable_settings = {
  anchor: '/',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = WhatsAppBridge.setupDeepLinkHandler?.((roomId: string) => {
        try {
          router.push({
            pathname: '/screens/Game',
            params: { roomId },
          });
        } catch (error) {
          console.warn('Erro ao navegar para sala:', error);
        }
      });
    } catch (error) {
      console.warn('Erro ao configurar deep link handler:', error);
    }

    return () => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.warn('Erro ao remover deep link listener:', error);
      }
    };
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="screens" />

        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerShown: true,
          }}
        />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthUserProvider>
      <RootLayoutNav />
    </AuthUserProvider>
  );
}