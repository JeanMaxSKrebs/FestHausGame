import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameCard } from '../../../components/GameCard';
import { AuthUserContext } from '../../../context/AuthUserProvider';
import { FirestoreManager, FirestorePlayerData } from '../../../game/FirestoreManager';
import { GameManager } from '../../../game/GameManager';
import { GameState, Player, PlayerHand } from '../../../game/types';
import { WhatsAppBridge } from '../../../game/WhatsAppBridge';
import { useFirestoreSync } from '../../../hooks/useFirestoreSync';

const MAX_PLAYERS = 12;
const MIN_PLAYERS_TO_START = 2;

const GameScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams() as any;
  const { user, loading: authLoading } = useContext(AuthUserContext);

  const initializedRef = useRef(false);

  const [gameManager, setGameManager] = useState<GameManager | null>(null);
  const [roomId, setRoomId] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayers, setCurrentPlayers] = useState(0);
  const [roomPlayers, setRoomPlayers] = useState<FirestorePlayerData[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayerHand | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isJoinMode = params?.mode === 'join';
  const canStartGame = currentPlayers >= MIN_PLAYERS_TO_START;
  const isHost = Boolean(user?.uid && gameManager?.getRoomConfig().hostId === user.uid);

  const getPlayerName = () => {
    const paramNickname = params?.nickname ? String(params.nickname).trim() : '';
    const fallbackName = user?.nome || user?.email?.split('@')[0] || 'Jogador';

    return paramNickname || fallbackName;
  };

  const goToJoinScreen = () => {
    router.replace({
      pathname: '/screens/Game',
      params: {
        mode: 'join',
        nickname: getPlayerName(),
      },
    });
  };

  const firestorePlayerToGamePlayer = (player: FirestorePlayerData): Player => {
    return {
      id: player.userId,
      name: player.name || 'Jogador',
      email: player.email || '',
      phone: player.phone || '',
      joinedAt: player.joinedAt?.toDate?.() || new Date(),
      isActive: true,
    };
  };

  const syncGameManagerPlayersFromFirestore = (
    manager: GameManager,
    players: FirestorePlayerData[]
  ) => {
    const state = manager.getGameState();

    players.forEach((firestorePlayer) => {
      if (!state.players.has(firestorePlayer.userId)) {
        const mappedPlayer = firestorePlayerToGamePlayer(firestorePlayer);
        state.players.set(mappedPlayer.id, mappedPlayer);
      }
    });

    state.roomConfig.currentPlayers = state.players.size;

    setGameState({ ...state });
  };

  useFirestoreSync({
    roomId: roomId || null,
    gameManager,
    userId: user?.uid || null,
    enabled: Boolean(roomId && user?.uid),
    onPlayersUpdate: (players) => {
      console.log('👥 Players atualizado via Firestore:', players);

      setRoomPlayers(players);
      setCurrentPlayers(players.length);

      if (gameManager) {
        syncGameManagerPlayersFromFirestore(gameManager, players);
      }
    },
    onError: (error: any) => {
      console.error('❌ Erro na sincronização Firestore:', error);
    },
  });

  useEffect(() => {
    if (isJoinMode) return;
    if (initializedRef.current) return;
    if (authLoading) return;
    if (!params?.roomId && !params?.createNew) return;

    const initializeGame = async () => {
      try {
        setLoading(true);

        if (!user?.uid) {
          console.log('⏳ Usuário ainda não disponível para criar/entrar na sala.');
          return;
        }

        initializedRef.current = true;

        if (params.createNew) {
          const newRoomId = `room_${Date.now()}`;

          const newGameManager = new GameManager(
            newRoomId,
            user.uid,
            params.roomType || 'waiting_room',
            MAX_PLAYERS
          );

          const currentPlayer: Player = {
            id: user.uid,
            name: getPlayerName(),
            phone: params.phone || '',
            email: user.email,
            profileImage: user.photoURL,
            joinedAt: new Date(),
            isActive: true,
          };

          newGameManager.addPlayer(currentPlayer);

          try {
            await FirestoreManager.createRoom(
              newRoomId,
              {
                roomId: newRoomId,
                roomType: (params.roomType || 'waiting_room') as any,
                maxPlayers: MAX_PLAYERS as any,
                hostId: user.uid,
                currentPlayers: 1,
                status: 'lobby',
                createdAt: new Date(),
              },
              user.uid
            );

            await FirestoreManager.syncHostPlayer(newRoomId, currentPlayer);

            console.log('✅ Sala criada e host sincronizado no Firestore:', newRoomId);
          } catch (error) {
            console.error('❌ Erro ao criar/sincronizar sala no Firestore:', error);
            Alert.alert('Erro', 'Não foi possível criar a sala.');
          }

          setupGameEventListeners(newGameManager);

          setGameManager(newGameManager);
          setRoomId(newRoomId);
          setCurrentPlayers(1);
          setRoomPlayers([
            {
              userId: currentPlayer.id,
              name: currentPlayer.name,
              email: currentPlayer.email || '',
              phone: currentPlayer.phone || '',
              joinedAt: new Date(),
              score: 0,
              isReady: true,
            },
          ]);
          updateGameState(newGameManager);
        } else if (params.roomId) {
          const existingRoomId = String(params.roomId).trim();

          if (!existingRoomId) {
            Alert.alert('Erro', 'Código da sala inválido.');
            goToJoinScreen();
            return;
          }

          const currentPlayer: Player = {
            id: user.uid,
            name: getPlayerName(),
            phone: '',
            email: user.email,
            profileImage: user.photoURL,
            joinedAt: new Date(),
            isActive: true,
          };

          try {
            const roomData = await FirestoreManager.getRoom(existingRoomId);

            if (!roomData) {
              Alert.alert('Sala indisponível', 'Essa sala não existe.');
              goToJoinScreen();
              return;
            }

            const isValid = await FirestoreManager.validateRoomInvite(existingRoomId);

            if (!isValid) {
              Alert.alert(
                'Sala indisponível',
                'A sala não existe, já começou, foi encerrada ou está cheia.'
              );

              goToJoinScreen();
              return;
            }

            await FirestoreManager.joinRoom(existingRoomId, currentPlayer);

            const joinedGameManager = new GameManager(
              existingRoomId,
              roomData.createdBy,
              roomData.roomType || 'waiting_room',
              roomData.maxPlayers || MAX_PLAYERS
            );

            joinedGameManager.addPlayer(currentPlayer);
            setupGameEventListeners(joinedGameManager);

            setRoomId(existingRoomId);
            setGameManager(joinedGameManager);
            setCurrentPlayers(Math.max(1, roomData.players?.length || 1));
            updateGameState(joinedGameManager);

            console.log('✅ Entrou na sala:', existingRoomId);
          } catch (error: any) {
            console.error('❌ Erro ao entrar na sala:', error);
            Alert.alert('Erro', error?.message || 'Não foi possível entrar na sala.');

            goToJoinScreen();
            return;
          }
        }
      } catch (error: any) {
        Alert.alert(
          'Erro',
          'Erro ao inicializar o jogo: ' +
          (error instanceof Error ? error.message : String(error))
        );
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    initializeGame();
  }, [params?.roomId, params?.createNew, isJoinMode, user?.uid, authLoading]);

  const setupGameEventListeners = (manager: GameManager) => {
    manager.on('player_joined', () => {
      updateGameState(manager);
    });

    manager.on('game_finished', (event: any) => {
      if (event.data.status === 'started') {
        setGameStarted(true);
        updateGameState(manager);
      }
    });

    manager.on('turn_started', () => {
      updateGameState(manager);
    });

    manager.on('card_played', () => {
      updateGameState(manager);
    });
  };

  const updateGameState = (manager: GameManager) => {
    const state = manager.getGameState();

    setGameState({ ...state });

    if (currentPlayers <= 0) {
      setCurrentPlayers(state.roomConfig.currentPlayers);
    }

    if (user?.uid) {
      const hand = manager.getPlayerHand(user.uid);
      setPlayerHand(hand || null);
    }
  };

  const getInviteLink = () => {
    return `festhausgame://room/${roomId}`;
  };

  const handleInviteWhatsApp = async () => {
    if (!roomId) {
      Alert.alert('Erro', 'Sala ainda não foi criada.');
      return;
    }

    try {
      await WhatsAppBridge.shareInvite(getPlayerName(), roomId);
    } catch (error) {
      console.warn('Erro ao compartilhar pelo WhatsAppBridge:', error);

      await Share.share({
        message: `🎉 Entre na minha sala do Fest Haus Game!\n\nCódigo da sala: ${roomId}\nLink: ${getInviteLink()}`,
      });
    }
  };

  const handleCopyInvite = async () => {
    if (!roomId) {
      Alert.alert('Erro', 'Sala ainda não foi criada.');
      return;
    }

    try {
      await WhatsAppBridge.copyLinkToClipboard(getInviteLink());
      Alert.alert('Copiado', 'Link da sala copiado para a área de transferência.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar o link.');
    }
  };

  const handleJoinRoom = () => {
    const code = joinCode.trim();

    if (!code) {
      Alert.alert('Erro', 'Digite o código da sala.');
      return;
    }

    initializedRef.current = false;

    router.replace({
      pathname: '/screens/Game',
      params: {
        roomId: code,
        nickname: getPlayerName(),
      },
    });
  };

  const handleStartGame = () => {
    console.log('▶️ Tentando iniciar jogo:', {
      currentPlayers,
      roomPlayers: roomPlayers.length,
      localPlayers: gameManager?.getGameState().players.size,
      canStartGame,
      min: MIN_PLAYERS_TO_START,
      isHost,
    });

    if (!canStartGame) {
      Alert.alert(
        'Aguardando jogadores',
        `É necessário no mínimo ${MIN_PLAYERS_TO_START} jogadores para começar. Atual: ${currentPlayers}.`
      );
      return;
    }

    try {
      if (!gameManager) {
        Alert.alert('Erro', 'GameManager não inicializado.');
        return;
      }

      syncGameManagerPlayersFromFirestore(gameManager, roomPlayers);

      if (gameManager.getGameState().players.size < MIN_PLAYERS_TO_START) {
        Alert.alert(
          'Aguardando jogadores',
          `A sala mostra ${currentPlayers} jogador(es), mas a lista local ainda não sincronizou. Tente novamente em instantes.`
        );
        return;
      }

      gameManager.startGame();
      setGameStarted(true);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  const handlePlayCard = (cardId: string) => {
    try {
      if (!gameManager || !user?.uid) {
        Alert.alert('Erro', 'Jogo ou usuário não inicializado.');
        return;
      }

      gameManager.playCard(user.uid, cardId);
      setSelectedCard(null);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Image
            source={require('../../../assets/images/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Carregando...</Text>
          <Text style={styles.subtitle}>Preparando sua sessão.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user?.uid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Image
            source={require('../../../assets/images/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Sessão não encontrada</Text>
          <Text style={styles.subtitle}>
            Faça login novamente para criar ou entrar em uma sala.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/screens/SignIn')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>IR PARA LOGIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isJoinMode) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Image
              source={require('../../../assets/images/logo/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>Entrar em Sala</Text>
            <Text style={styles.subtitle}>
              Você entrará como: {getPlayerName()}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Código da sala"
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleJoinRoom}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>ENTRAR NA SALA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>VOLTAR</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Image
            source={require('../../../assets/images/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Preparando sala...</Text>
          <Text style={styles.subtitle}>Sincronizando jogadores.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameManager && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Image
            source={require('../../../assets/images/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Sala não encontrada</Text>
          <Text style={styles.subtitle}>
            Volte e tente criar ou entrar em uma sala novamente.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>VOLTAR</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameStarted) {
    const playersToRender =
      roomPlayers.length > 0
        ? roomPlayers
        : gameState
          ? Array.from(gameState.players.values()).map((player) => ({
            userId: player.id,
            name: player.name,
            email: player.email || '',
            phone: player.phone || '',
            joinedAt: player.joinedAt,
            score: 0,
            isReady: false,
          }))
          : [];

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Image
              source={require('../../../assets/images/logo/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>Sala de Espera</Text>
            <Text style={styles.subtitle}>Você está como: {getPlayerName()}</Text>
            <Text style={styles.roomId}>Código: {roomId}</Text>

            <View style={styles.playerCountContainer}>
              <Text style={styles.playerCount}>
                Jogadores: {currentPlayers}/{gameManager?.getRoomConfig().maxPlayers || MAX_PLAYERS}
              </Text>
            </View>

            <View style={styles.playersListContainer}>
              <Text style={styles.playersTitle}>Jogadores na Sala</Text>

              {playersToRender.length > 0 ? (
                playersToRender.map((player) => (
                  <View key={player.userId} style={styles.playerItem}>
                    <Text style={styles.playerName}>{player.name}</Text>

                    {gameManager && player.userId === gameManager.getRoomConfig().hostId && (
                      <Text style={styles.hostBadge}>Host</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyPlayersText}>
                  Aguardando jogadores...
                </Text>
              )}
            </View>

            {isHost && (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.whatsappButton]}
                  onPress={handleInviteWhatsApp}
                  activeOpacity={0.8}
                >
                  <FontAwesome name="whatsapp" size={18} color="#fff" />
                  <Text style={styles.buttonText}>CONVIDAR PELO WHATSAPP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.copyButton]}
                  onPress={handleCopyInvite}
                  activeOpacity={0.8}
                >
                  <FontAwesome name="copy" size={18} color="#fff" />
                  <Text style={styles.buttonText}>COPIAR LINK DA SALA</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.startButton,
                    !canStartGame && styles.disabledButton,
                  ]}
                  onPress={handleStartGame}
                  disabled={!canStartGame}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>
                    COMEÇAR JOGO ({currentPlayers}/{MIN_PLAYERS_TO_START} min)
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {!isHost && (
              <View style={styles.waitingCard}>
                <Text style={styles.waitingText}>
                  Aguardando o host iniciar o jogo...
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>SAIR DA SALA</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameContainer}>
        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle}>Fest Haus Game</Text>
          <Text style={styles.roundInfo}>Rodada {gameState?.round}</Text>
        </View>

        <View style={styles.handContainer}>
          <Text style={styles.handTitle}>
            Sua Mão ({playerHand?.items.length || 0} cartas)
          </Text>

          <ScrollView horizontal style={styles.cardsScroll}>
            {playerHand?.items?.map((item: any) => (
              <GameCard
                key={item.id}
                item={item}
                selected={selectedCard?.id === item.id}
                onPress={() => setSelectedCard(item)}
              />
            ))}
          </ScrollView>
        </View>

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
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  roomId: {
    fontSize: 15,
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
  emptyPlayersText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 10,
  },
  waitingCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  waitingText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  copyButton: {
    backgroundColor: '#5856D6',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
    minHeight: 180,
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