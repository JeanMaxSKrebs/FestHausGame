import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
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
import { FirestoreManager } from '../../../game/FirestoreManager';
import { GameManager } from '../../../game/GameManager';
import { GameState, Player, PlayerHand } from '../../../game/types';
import { InviteManager, WhatsAppBridge } from '../../../game/WhatsAppBridge';
import { useFirestoreSync } from '../../../hooks/useFirestoreSync';

const GameScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams() as any;
  const { user } = useContext(AuthUserContext);
  const [gameManager, setGameManager] = useState<GameManager | null>(null);
  const [roomId, setRoomId] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayers, setCurrentPlayers] = useState(0);
  const [playerHand, setPlayerHand] = useState<PlayerHand | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // Sincronização com Firestore
  useFirestoreSync({
    roomId,
    gameManager: gameManager,
    userId: user?.uid || '',
    onPlayersUpdate: (players) => {
      console.log('👥 Players atualizado via Firestore:', players);
      setCurrentPlayers(players.length);
    },
    onError: (error: any) => {
      console.error('❌ Erro na sincronização Firestore:', error);
    },
  });

  // Inicializar jogo
  useEffect(() => {
    if (!params?.roomId && !params?.createNew) {
      return;
    }

    const initializeGame = async () => {
      try {
        setLoading(true);
        
        // Se for criar uma nova sala
        if (params.createNew) {
          const newRoomId = `room_${Date.now()}`;
          const newGameManager = new GameManager(
            newRoomId,
            user.uid,
            params.roomType || 'waiting_room',
            params.maxPlayers || 6
          );

          // Adicionar o próprio usuário como jogador
          const currentPlayer: Player = {
            id: user.uid,
            name: user.nome || user.email,
            phone: params.phone || '',
            email: user.email,
            profileImage: user.photoURL,
            joinedAt: new Date(),
            isActive: true,
          };

          newGameManager.addPlayer(currentPlayer);

          // Criar sala no Firestore
          try {
            await FirestoreManager.createRoom(
              newRoomId,
              {
                roomId: newRoomId,
                roomType: (params.roomType || 'waiting_room') as any,
                maxPlayers: parseInt(String(params.maxPlayers || 6)) as any,
                hostId: user.uid,
                currentPlayers: 1,
                status: 'lobby',
                createdAt: new Date(),
              },
              user.uid
            );
            console.log('✅ Sala criada no Firestore:', newRoomId);
          } catch (error) {
            console.error('❌ Erro ao criar sala no Firestore:', error);
          }

          // Configurar listeners de eventos
          setupGameEventListeners(newGameManager);

          // Se for convite direto, gerar link de WhatsApp
          if (params.roomType === 'direct_invite') {
            const invite = InviteManager.createInvite(
              newRoomId,
              currentPlayer.name,
              params.phoneNumbers
            );
            
            // Mostrar opções de compartilhamento
            showShareOptions(invite, newGameManager);
          }

          setGameManager(newGameManager);
          setRoomId(newRoomId);
          updateGameState(newGameManager);
        } else {
          // Se for entrar em uma sala existente (hot-join)
          // Aqui você recuperaria o gameManager do servidor/contexto
          // Por enquanto, apenas simular
          setRoomId(params.roomId);
        }

        setLoading(false);
      } catch (error: any) {
        Alert.alert('Erro', 'Erro ao inicializar o jogo: ' + (error instanceof Error ? error.message : String(error)));
        console.error(error);
        setLoading(false);
      }
    };

    initializeGame();
  }, [params?.roomId, params?.createNew, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Setup listeners de eventos do jogo
  const setupGameEventListeners = (manager: GameManager) => {
    manager.on('player_joined', (event: any) => {
      Alert.alert(
        'Novo Jogador',
        `${event.data.playerName} entrou na sala! (${event.data.totalPlayers}/${manager.getRoomConfig().maxPlayers})`
      );
      updateGameState(manager);
    });

    manager.on('game_finished', (event: any) => {
      if (event.data.status === 'started') {
        setGameStarted(true);
        updateGameState(manager);
      }
    });

    manager.on('turn_started', (event: any) => {
      updateGameState(manager);
    });

    manager.on('card_played', (event: any) => {
      updateGameState(manager);
    });
  };

  // Atualizar o estado do jogo
  const updateGameState = (manager: GameManager) => {
    const state = manager.getGameState();
    setGameState(state);
    setCurrentPlayers(state.roomConfig.currentPlayers);
    
    const hand = manager.getPlayerHand(user.uid);
    setPlayerHand(hand || null);
  };

  // Mostrar opções de compartilhamento
  const showShareOptions = (invite: any, manager: GameManager) => {
    Alert.alert(
      'Compartilhar Sala',
      'Como você gostaria de convidar seus amigos?',
      [
        {
          text: 'WhatsApp',
          onPress: async () => {
            try {
              await WhatsAppBridge.sendViaWhatsApp(
                user.nome || user.email,
                roomId,
                params.phoneNumbers?.[0] || ''
              );
            } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
              Alert.alert('Erro', 'WhatsApp não está instalado');
            }
          },
        },
        {
          text: 'Copiar Link',
          onPress: async () => {
            try {
              await WhatsAppBridge.copyLinkToClipboard(invite.deepLink);
              Alert.alert('Sucesso', 'Link copiado para a área de transferência!');
            } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
              Alert.alert('Erro', 'Erro ao copiar link');
            }
          },
        },
        {
          text: 'Compartilhar',
          onPress: async () => {
            try {
              await WhatsAppBridge.shareInvite(user.nome || user.email, roomId);
            } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
              Alert.alert('Erro', 'Erro ao compartilhar');
            }
          },
        },
        {
          text: 'Fechar',
          onPress: () => {},
        },
      ]
    );
  };

  // Iniciar o jogo
  const handleStartGame = () => {
    if (currentPlayers < 2) {
      Alert.alert('Erro', 'É necessário no mínimo 2 jogadores para começar.');
      return;
    }

    try {
      if (!gameManager) {
        Alert.alert('Erro', 'GameManager não inicializado');
        return;
      }
      gameManager.startGame();
      setGameStarted(true);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  // Jogar uma carta
  const handlePlayCard = (cardId: string) => {
    try {
      if (!gameManager) {
        Alert.alert('Erro', 'GameManager não inicializado');
        return;
      }
      gameManager.playCard(user.uid, cardId);
      setSelectedCard(null);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  // Se o jogo não foi inicializado
  if (!gameManager && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Inicializando Jogo...</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Se o jogo está aguardando jogadores
  if (!gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Image
              source={require('../../../assets/images/logo/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Fest Haus Game</Text>
            <Text style={styles.roomId}>Sala: {roomId}</Text>

            <View style={styles.playerCountContainer}>
              <Text style={styles.playerCount}>
                Jogadores: {currentPlayers}/{gameManager?.getRoomConfig().maxPlayers}
              </Text>
            </View>

            {/* Listar jogadores */}
            {gameState && gameState.players.size > 0 && (
              <View style={styles.playersListContainer}>
                <Text style={styles.playersTitle}>Jogadores na Sala:</Text>
                {Array.from(gameState.players.values()).map((player) => (
                  <View key={player.id} style={styles.playerItem}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    {gameManager && player.id === gameManager.getRoomConfig().hostId && (
                      <Text style={styles.hostBadge}>Host</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {user.uid === gameManager?.getRoomConfig().hostId && (
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={handleStartGame}
                disabled={currentPlayers < 2}
              >
                <Text style={styles.buttonText}>
                  COMEÇAR JOGO ({currentPlayers}/2 min)
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>Sair da Sala</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Tela de jogo ativo
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameContainer}>
        {/* Informações do Jogo */}
        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle}>Fest Haus Game</Text>
          <Text style={styles.roundInfo}>Rodada {gameState?.round}</Text>
        </View>

        {/* Mão do Jogador */}
        <View style={styles.handContainer}>
          <Text style={styles.handTitle}>Sua Mão ({playerHand?.items.length || 0} cartas)</Text>
          <ScrollView horizontal style={styles.cardsScroll}>
                  {playerHand?.items?.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  selectedCard?.id === item.id && styles.cardSelected,
                ]}
                onPress={() => setSelectedCard(item)}
              >
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardValue}>{item.value}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Ações */}
        {selectedCard && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePlayCard(selectedCard.id)}
            >
              <Text style={styles.actionButtonText}>Jogar Carta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => setSelectedCard(null)}
            >
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Log do Jogo */}
        <View style={styles.logContainer}>
          <Text style={styles.logTitle}>Turno Atual</Text>
          {gameState?.currentTurn && (
            <Text style={styles.logText}>
              Líder: {gameState.players.get(gameState.currentTurn.leaderId)?.name}
            </Text>
          )}
        </View>
      </View>
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
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContainer: {
    flex: 1,
    padding: 15,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  roomId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  playerCountContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  playerCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  playersListContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playerName: {
    fontSize: 14,
    color: '#333',
  },
  hostBadge: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Game Screen Styles
  gameInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  roundInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  handContainer: {
    marginBottom: 20,
  },
  handTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardsScroll: {
    height: 120,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  cardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E7F3FF',
  },
  cardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  logText: {
    fontSize: 13,
    color: '#666',
  },
});

export default GameScreen;
