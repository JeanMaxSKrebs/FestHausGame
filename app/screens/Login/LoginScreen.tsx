// ✅ Google Sign-In Nativo (SEM navegador)
import {
  GoogleSignin,
  statusCodes,
  type SignInSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthUserContext } from '../../../context/AuthUserProvider';
import { auth } from '../../../services/firebase/config';

/**
 * Tipo para usuário autenticado
 */
interface AuthenticatedUser {
  id: string;
  email: string;
  nome: string;
  photoURL?: string;
  accessToken?: string;
}

/**
 * LoginScreen - Tela de autenticação com Google
 * Componente para login no Fest Haus Game
 * 
 * SHA-1 para Produção: 93:6C:C5:BE:22:E1:22:08:23:B6:3A:AC:5D:57:C8:CA:40:56:AB:E7
 */
const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useContext(AuthUserContext);

  const [authenticatedUser, setAuthenticatedUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ✅ Configurar Google Sign-In Nativo
  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        scopes: ['profile', 'email'],
      });
      console.log('✅ [LoginScreen] GoogleSignin configurado');
    } catch (error) {
      console.log('⚠️ [LoginScreen] GoogleSignin erro:', error);
    }
  }, []);

  /**
   * Login com Google Nativo
   */
  const handleGoogleNativeLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      console.log('🔐 [LoginScreen] Abrindo Google Sign-In nativo...');
      const response = await GoogleSignin.signIn() as SignInSuccessResponse;
      const userInfo = response.data?.user;
      console.log('✅ [LoginScreen] Google Sign-In OK:', userInfo?.email);

      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        throw new Error('Sem ID Token');
      }

      console.log('🔐 [LoginScreen] Autenticando no Firebase...');
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      console.log('✅ [LoginScreen] Firebase OK:', firebaseUser.email);

      const googleUser: AuthenticatedUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        nome: userInfo?.name || 'Usuário',
        photoURL: userInfo?.photo || undefined,
        accessToken: tokens.accessToken,
      };

      setAuthenticatedUser(googleUser);
      console.log('🚀 [LoginScreen] Navegando para Home...');
      router.replace('/screens/Home');
    } catch (error: any) {
      console.error('❌ [LoginScreen] Erro:', error.message);
      setErrorMessage(error.message);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('ℹ️ Usuário cancelou');
      } else {
        Alert.alert('Erro', error.message || 'Erro ao fazer login');
      }
      
      setIsLoading(false);
    }
  };

  /**
   * Clica no botão Email
   */
  const handleEmailLogin = () => {
    router.push('/screens/SignIn');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header com logo */}
        <View style={styles.headerSection}>
          <Image
            source={require('../../../assets/images/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Fest Haus Game</Text>
          <Text style={styles.subtitle}>Multiplayer Party Game</Text>
        </View>

        {/* Seção de descrição */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>
            🎉 Junte-se aos amigos para uma noite inesquecível!
          </Text>
          <Text style={styles.descriptionSubtext}>
            Autentique-se para começar a jogar
          </Text>
        </View>

        {/* Seção de autenticação */}
        <View style={styles.authSection}>
          {/* Botão Google */}
          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.buttonDisabled]}
            onPress={handleGoogleNativeLogin}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Icon name="google" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.googleButtonText}>ENTRAR COM GOOGLE</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divisor */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botão Email */}
          <TouchableOpacity
            style={[styles.emailButton, isLoading && styles.buttonDisabled]}
            onPress={handleEmailLogin}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Icon name="envelope" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.emailButtonText}>ENTRAR COM EMAIL</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de erro (debug) */}
        {errorMessage && (
          <View style={styles.errorSection}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        )}

        {/* Usuário autenticado (debug) */}
        {authenticatedUser && (
          <View style={styles.userInfoSection}>
            <View style={styles.userCard}>
              {authenticatedUser.photoURL && (
                <Image
                  source={{ uri: authenticatedUser.photoURL }}
                  style={styles.userPhoto}
                />
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{authenticatedUser.nome}</Text>
                <Text style={styles.userEmail}>{authenticatedUser.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            Ao fazer login, você concorda com nossos Termos de Serviço
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0b0',
    fontStyle: 'italic',
  },

  // Description Section
  descriptionSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 15,
  },
  descriptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionSubtext: {
    fontSize: 14,
    color: '#8a8a8a',
    textAlign: 'center',
  },

  // Auth Section
  authSection: {
    marginBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emailButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#444444',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },

  // Error Section
  errorSection: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    color: '#FFE5E5',
    fontSize: 13,
    lineHeight: 18,
  },

  // User Info Section
  userInfoSection: {
    marginBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
  },
  userPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#8a8a8a',
  },

  // Footer Section
  footerSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
