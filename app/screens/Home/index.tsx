import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthUserContext } from '../../../context/AuthUserProvider';

const Home = () => {
  const { user, signOut } = useContext(AuthUserContext);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
  };

  const handleCreateGameWaitingRoom = () => {
    router.push({
      pathname: '/screens/Game',
      params: {
        createNew: 'true',
        roomType: 'waiting_room',
        maxPlayers: '6',
      },
    });
  };

  const handleJoinGame = () => {
    Alert.alert(
      'Entrar em Sala',
      'Funcionalidade em desenvolvimento. Em breve você poderá colar um código ou abrir um convite.'
    );
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

        <View style={styles.gameOptionsContainer}>
          <Text style={styles.sectionTitle}>Jogar Agora</Text>

          <TouchableOpacity
            style={styles.gameOption}
            onPress={handleCreateGameWaitingRoom}
            activeOpacity={0.8}
          >
            <View style={styles.gameOptionIcon}>
              <FontAwesome name="users" size={28} color="#fff" />
            </View>

            <View style={styles.gameOptionContent}>
              <Text style={styles.gameOptionTitle}>Criar Sala de Espera</Text>
              <Text style={styles.gameOptionDesc}>
                Crie uma sala e convide seus amigos depois.
              </Text>
            </View>

            <FontAwesome name="chevron-right" size={20} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gameOption}
            onPress={handleJoinGame}
            activeOpacity={0.8}
          >
            <View style={[styles.gameOptionIcon, styles.joinIcon]}>
              <FontAwesome name="sign-in" size={28} color="#fff" />
            </View>

            <View style={styles.gameOptionContent}>
              <Text style={styles.gameOptionTitle}>Entrar em Sala</Text>
              <Text style={styles.gameOptionDesc}>
                Entre usando um código ou convite de um amigo.
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
    marginBottom: 25,
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
});

export default Home;