import React, { useState, useContext } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthUserContext } from '../../context/AuthUserProvider';

const SignIn = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useContext(AuthUserContext);

  const handleSignIn = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, senha);
    } catch (error) {
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

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao fazer login com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Fest Haus Game</Text>
          <Text style={styles.subtitle}>Bem-vindo de volta</Text>

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

          <View style={styles.buttonContainer}>
            <Text
              style={styles.button}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'ENTRAR'}
            </Text>
          </View>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Icon name="google" size={20} color="#fff" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>ENTRAR COM GOOGLE</Text>
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Não tem uma conta? </Text>
            <Text
              style={styles.signUpLink}
              onPress={handleSignUp}
            >
              Cadastre-se
            </Text>
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
    color: '#999',
  },  googleButton: {
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
  },  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
