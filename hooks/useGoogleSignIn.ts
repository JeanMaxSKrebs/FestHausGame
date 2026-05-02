import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { auth } from '../services/firebase/config';

export function useGoogleSignIn(): { request: any; loading: boolean; promptAsync: any } {
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Web Client ID
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    // Android Client ID
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_NATIVE_CLIENT_ID,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignInResponse();
    }
  }, [response]);

  const handleGoogleSignInResponse = async () => {
    try {
      setLoading(true);
      const authResult = response as any;
      const idToken = authResult?.params?.id_token;
      const accessToken = authResult?.params?.access_token;
      
      if (idToken) {
        // Usar o ID Token para autenicar no Firebase
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        
        const result = await signInWithCredential(auth, credential);
        console.log('✅ Google Sign-In bem-sucedido:', result.user.email);
        
        Alert.alert(
          'Sucesso',
          `Login realizado com ${result.user.displayName || result.user.email}`
        );
      }
    } catch (error: any) {
      console.error('❌ Erro ao fazer login com Google:', error);
      Alert.alert('Erro', 'Falha ao fazer login com Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    request,
    loading,
    promptAsync,
  };
}
