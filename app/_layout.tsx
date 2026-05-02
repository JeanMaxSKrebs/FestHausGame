import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthUserContext, AuthUserProvider } from '../context/AuthUserProvider';
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
  const { user, loading } = useContext(AuthUserContext);
  const router = useRouter();

  // Setup Deep Link Handler
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    try {
      unsubscribe = WhatsAppBridge.setupDeepLinkHandler?.((
        roomId: string
      ) => {
        // Navigar para a tela de jogo com o roomId
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
        if (typeof unsubscribe === 'function' && unsubscribe) {
          (unsubscribe as () => void)();
        }
      } catch (error) {
        console.warn('Erro ao remover deep link listener:', error);
      }
    };
  }, [router]);

  // Redirect based on auth state
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        if (user) {
          router.replace('/screens/Home');
        } else {
          router.replace('/screens/SignIn');
        }
      }, 100);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{}}>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false
          }} 
        />
        
        <Stack.Screen 
          name="screens" 
          options={{ 
            headerShown: false
          }} 
        />

        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal',
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

