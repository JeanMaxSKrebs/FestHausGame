import { FontAwesome } from '@expo/vector-icons';
import {
  GoogleSignin,
  statusCodes,
  type SignInSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthUserContext } from '../../../context/AuthUserProvider';
import { auth } from '../../../services/firebase/config';

const SignIn = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const didNavigateRef = useRef(false);

  const { signIn, user } = useContext(AuthUserContext);

  useEffect(() => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

    console.log('🔎 [SignIn] Google WEB_CLIENT_ID:', webClientId);
    console.log('🔎 [SignIn] Platform:', Platform.OS);

    if (!webClientId) {
      console.warn('⚠️ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID não está configurado no .env');
      return;
    }

    GoogleSignin.configure({
      webClientId,
      iosClientId: Platform.OS === 'ios' ? iosClientId : undefined,
      scopes: ['profile', 'email'],
      offlineAccess: false,
    });

    console.log('✅ [SignIn] GoogleSignin configurado');
  }, []);

  useEffect(() => {
    if (!user || didNavigateRef.current) return;

    didNavigateRef.current = true;
    router.replace('/screens/Home');
  }, [user, router]);

  const validateInputs = () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Email inválido.');
      return false;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'Senha deve ter no mínimo 6 caracteres.');
      return false;
    }

    return true;
  };

  const handleSignIn = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      await signIn(email.trim(), senha);
    } catch (error: any) {
      switch (error.code) {
        case 'auth/user-not-found':
          Alert.alert('Erro', 'Usuário não encontrado.');
          break;
        case 'auth/wrong-password':
          Alert.alert('Erro', 'Senha incorreta.');
          break;
        case 'auth/invalid-email':
          Alert.alert('Erro', 'Email inválido.');
          break;
        default:
          Alert.alert('Erro', error.message || 'Erro ao fazer login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);

      console.log('🔐 [SignIn] Abrindo Google Sign-In nativo...');

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      await GoogleSignin.signOut().catch(() => { });

      const response = (await GoogleSignin.signIn()) as SignInSuccessResponse;
      const userInfo = response.data?.user;

      console.log('✅ [SignIn] Google Sign-In OK:', userInfo?.email);

      let idToken = response.data?.idToken;

      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
      }

      if (!idToken) {
        throw new Error('Google não retornou ID Token.');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);

      console.log('✅ [SignIn] Firebase OK:', userCredential.user.email);

    } catch (error: any) {
      console.error('❌ [SignIn] Erro Google:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('ℹ️ Usuário cancelou o login Google.');
        return;
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Aguarde', 'O login com Google já está em andamento.');
        return;
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Erro', 'Google Play Services não está disponível ou está desatualizado.');
        return;
      }

      Alert.alert('Erro', error.message || 'Erro ao fazer login com Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/screens/SignUp');
  };

  const isBusy = loading || googleLoading;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.content}>
          <Image
            source={require('../../../assets/images/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Fest Haus Game</Text>
          <Text style={styles.subtitle}>Bem-vindo de volta</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            editable={!isBusy}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#999"
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Senha"
              secureTextEntry={!showPassword}
              editable={!isBusy}
              value={senha}
              onChangeText={setSenha}
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isBusy}
            >
              <FontAwesome
                name={showPassword ? 'eye' : 'eye-slash'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, isBusy && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={isBusy}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>ENTRAR</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, isBusy && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isBusy}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <FontAwesome name="google" size={20} color="#fff" style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>ENTRAR COM GOOGLE</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Não tem uma conta? </Text>

            <TouchableOpacity onPress={handleSignUp} disabled={isBusy}>
              <Text style={styles.signUpLink}>Cadastre-se aqui</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 13,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingRight: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 13,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
  },
  googleButton: {
    backgroundColor: '#EA4335',
    flexDirection: 'row',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signUpText: {
    color: '#666',
    fontSize: 14,
  },
  signUpLink: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default SignIn;