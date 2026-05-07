import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
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

const MAX_PLAYERS = 12;
const GAME_NICKNAME_KEY = '@festhausgame:nickname';

const Home = () => {
  const { user, signOut } = useContext(AuthUserContext);
  const router = useRouter();

  const [nickname, setNickname] = useState('');

  useEffect(() => {
    async function loadNickname() {
      try {
        const savedNickname = await AsyncStorage.getItem(GAME_NICKNAME_KEY);

        if (savedNickname) {
          setNickname(savedNickname);
          return;
        }

        const fallbackName = user?.nome || user?.email?.split('@')[0] || '';
        setNickname(fallbackName);
      } catch (error) {
        console.warn('Erro ao carregar apelido:', error);
      }
    }

    loadNickname();
  }, [user?.nome, user?.email]);

  const getSafeNickname = async () => {
    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length < 2) {
      Alert.alert('Apelido obrigatório', 'Digite um apelido com pelo menos 2 caracteres.');
      return null;
    }

    if (trimmedNickname.length > 18) {
      Alert.alert('Apelido muito grande', 'Use um apelido com no máximo 18 caracteres.');
      return null;
    }

    await AsyncStorage.setItem(GAME_NICKNAME_KEY, trimmedNickname);

    return trimmedNickname;
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleCreateRoom = async () => {
    const safeNickname = await getSafeNickname();

    if (!safeNickname) return;

    router.push({
      pathname: '/screens/Game',
      params: {
        createNew: 'true',
        roomType: 'waiting_room',
        maxPlayers: String(MAX_PLAYERS),
        nickname: safeNickname,
      },
    });
  };

  const handleSoloMode = async () => {
    const safeNickname = await getSafeNickname();

    if (!safeNickname) return;

    router.push({
      pathname: '/screens/Game',
      params: {
        createNew: 'true',
        roomType: 'solo',
        soloMode: 'true',
        maxPlayers: String(MAX_PLAYERS),
        nickname: safeNickname,
      },
    });
  };

  const handleJoinRoom = async () => {
    const safeNickname = await getSafeNickname();

    if (!safeNickname) return;

    router.push({
      pathname: '/screens/Game',
      params: {
        mode: 'join',
        nickname: safeNickname,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Fest Haus Game</Text>
          <Text style={styles.subtitle}>Bem-vindo!</Text>
        </View>

        {user && (
          <View style={styles.userCard}>
            <FontAwesome name="user-circle" size={40} color="#007AFF" />

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.nome || user.email}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        )}

        <View style={styles.nicknameCard}>
          <Text style={styles.nicknameLabel}>Apelido no jogo</Text>

          <TextInput
            style={styles.nicknameInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Ex: Max, Jean, Thais..."
            placeholderTextColor="#999"
            maxLength={18}
            autoCapitalize="words"
          />

          <Text style={styles.nicknameHint}>
            Esse nome vai aparecer para os outros jogadores na sala.
          </Text>
        </View>

        <View style={styles.gameOptionsContainer}>
          <Text style={styles.sectionTitle}>Jogar Agora</Text>

          <TouchableOpacity
            style={[styles.gameOption, styles.soloOption]}
            onPress={handleSoloMode}
            activeOpacity={0.8}
          >
            <View style={[styles.gameOptionIcon, styles.soloIcon]}>
              <FontAwesome name="mobile" size={30} color="#fff" />
            </View>

            <View style={styles.gameOptionContent}>
              <Text style={styles.gameOptionTitle}>Modo Solo</Text>
              <Text style={styles.gameOptionDesc}>
                Jogue com várias pessoas usando apenas um celular, sem criar sala online.
              </Text>
            </View>

            <FontAwesome name="chevron-right" size={20} color="#8E44AD" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gameOption}
            onPress={handleCreateRoom}
            activeOpacity={0.8}
          >
            <View style={styles.gameOptionIcon}>
              <FontAwesome name="users" size={28} color="#fff" />
            </View>

            <View style={styles.gameOptionContent}>
              <Text style={styles.gameOptionTitle}>Criar Sala de Espera</Text>
              <Text style={styles.gameOptionDesc}>
                Crie uma sala para até 12 jogadores e convide seus amigos dentro dela.
              </Text>
            </View>

            <FontAwesome name="chevron-right" size={20} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gameOption}
            onPress={handleJoinRoom}
            activeOpacity={0.8}
          >
            <View style={[styles.gameOptionIcon, styles.joinIcon]}>
              <FontAwesome name="sign-in" size={28} color="#fff" />
            </View>

            <View style={styles.gameOptionContent}>
              <Text style={styles.gameOptionTitle}>Entrar em Sala</Text>
              <Text style={styles.gameOptionDesc}>
                Digite o código ou entre por um convite.
              </Text>
            </View>

            <FontAwesome name="chevron-right" size={20} color="#FF9500" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <FontAwesome name="sign-out" size={18} color="#fff" />
          <Text style={styles.logoutButtonText}>SAIR</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  nicknameCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  nicknameLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  nicknameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  nicknameHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  gameOptionsContainer: {
    flex: 1,
    marginBottom: 25,
  },
  gameOption: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  gameOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinIcon: {
    backgroundColor: '#FF9500',
  },
  gameOptionContent: {
    flex: 1,
    marginLeft: 15,
  },
  gameOptionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  gameOptionDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  soloOption: {
    borderWidth: 1,
    borderColor: '#eadcf5',
  },

  soloIcon: {
    backgroundColor: '#8E44AD',
  },
});

export default Home;