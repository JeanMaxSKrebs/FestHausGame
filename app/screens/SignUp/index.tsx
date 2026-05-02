import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import {
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
import { AuthUserContext } from '../../../context/AuthUserProvider';

const SignUp = () => {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useContext(AuthUserContext);

  const handleSignUp = async () => {
    if (!nome || !email || !senha || !confirmaSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (senha !== confirmaSenha) {
      Alert.alert('Erro', 'As senhas não correspondem.');
      return;
    }

    try {
      setLoading(true);
      await signUp(nome, email, senha);
      Alert.alert(
        'Sucesso',
        `Um email de verificação foi enviado para ${email}. Por favor, verifique sua caixa de entrada.`
      );
      router.replace('/screens/SignIn');
    } catch (error: any) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          Alert.alert('Erro', 'Este email já está cadastrado.');
          break;
        case 'auth/weak-password':
          Alert.alert('Erro', 'Senha fraca. Use uma senha mais forte.');
          break;
        case 'auth/invalid-email':
          Alert.alert('Erro', 'Email inválido.');
          break;
        default:
          Alert.alert('Erro', 'Erro ao criar conta.');
      }
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Junte-se ao Fest Haus Game</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome Completo"
            keyboardType="default"
            editable={!loading}
            value={nome}
            onChangeText={setNome}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            editable={!loading}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry={true}
            editable={!loading}
            value={senha}
            onChangeText={setSenha}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar Senha"
            secureTextEntry={true}
            editable={!loading}
            value={confirmaSenha}
            onChangeText={setConfirmaSenha}
          />

          <TouchableOpacity 
            style={styles.buttonContainer}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.button}>
              {loading ? 'Criando conta...' : 'CADASTRAR'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.replace('/screens/SignIn')}>
              <Text style={styles.loginLink}>Faça login</Text>
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
    backgroundColor: '#fff',
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
    width: 100,
    height: 100,
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
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
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    color: '#fff',
    padding: 15,
    textAlign: 'center',
    borderRadius: 8,
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
    color: '#666',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default SignUp;
