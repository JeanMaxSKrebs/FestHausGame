import React, { useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { AuthUserContext } from '../../context/AuthUserProvider';

const Home = () => {
  const { user, signOut } = useContext(AuthUserContext);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.subtitle}>Fest Haus Game</Text>
        
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userLabel}>Usuário:</Text>
            <Text style={styles.userName}>{user.nome || user.email}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>SAIR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  userInfo: {
    marginBottom: 30,
    alignItems: 'center',
  },
  userLabel: {
    fontSize: 14,
    color: '#999',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Home;
