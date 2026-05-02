import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthUserContext } from '../../../context/AuthUserProvider';
import { useGoogleSignIn } from '../../../hooks/useGoogleSignIn';

const SignIn = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useContext(AuthUserContext);
  const { request: googleRequest, loading: googleLoading, promptAsync: googlePromptAsync } = useGoogleSignIn();



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
      await signIn(email, senha);
      // Telefone será armazenado no perfil do usuário
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
          Alert.alert('Erro', 'Erro ao fazer login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      if (googleRequest) {
        await googlePromptAsync();
      } else {
        Alert.alert('Erro', 'Google Sign-In não está pronto. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleSignUp = () => {
    router.push('/screens/SignUp');
  };

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
            editable={!loading}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#999"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Senha"
              secureTextEntry={!showPassword}
              editable={!loading}
              value={senha}
              onChangeText={setSenha}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Icon
                name={showPassword ? 'eye' : 'eye-slash'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
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
            style={[styles.googleButton, (loading || googleLoading || !googleRequest) && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading || !googleRequest}
          >
            <Icon name="google" size={20} color="#fff" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>ENTRAR COM GOOGLE</Text>
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
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
