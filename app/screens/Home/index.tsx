import { useRouter } from 'expo-router';
import { useContext } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
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

  const handleCreateGameDirectInvite = () => {
    router.push({
      pathname: '/screens/Game',
      params: {
        createNew: 'true',
        roomType: 'direct_invite',
        maxPlayers: '6',
        phone: user?.phone || '',
      },
    });
  };

  const handleJoinGame = () => {
    // Navegar para tela de entrada de código/convite
    alert('Funcionalidade em desenvolvimento - Escaneie o código QR ou cole o link de convite');
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
          <Text style={styles.title}>Bem-vindo!</Text>
        </View>

        {user && (
          <View style={styles.userCard}>
            <Icon name="user-circle" size={40} color="#007AFF" />
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
          >
            <View style={styles.gameOptionIcon}>
              <Icon name="users" size={28} color="#fff" />
            </View>
            <View style={styles.gameOptionContent}>
              <Text style={styles.gameOptionTitle}>Criar Sala de Espera</Text>
              <Text style={styles.gameOptionDesc}>Convide amigos e comece quando todos estiverem prontos</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gameOption}
            onPress={handleCreateGameDirectInvite}
          >
            <View style={[styles.gameOptionIcon, styles.whatsappIcon]}>
              <Icon name="whatsapp" size={28} color="#fff" />
            </View>
            <View style={styles.gameOptionContent}>
              <Text style={styles.gameOptionTitle}>Convite WhatsApp</Text>
              <Text style={styles.gameOptionDesc}>Crie um link de convite direto para WhatsApp</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#25D366" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gameOption}
            onPress={handleJoinGame}
          >
            <View style={[styles.gameOptionIcon, styles.joinIcon]}>
              <Icon name="sign-in" size={28} color="#fff" />
            </View>
            <View style={styles.gameOptionContent}>
              <Text style={styles.gameOptionTitle}>Entrar em Sala</Text>
              <Text style={styles.gameOptionDesc}>Cole um código ou escaneie QR de um amigo</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#FF9500" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Partidas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Vitórias</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Pontos</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="sign-out" size={18} color="#fff" />
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
  whatsappIcon: {
    backgroundColor: '#25D366',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
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
