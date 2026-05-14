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

import { AnimatedDeck } from '../../../components/AnimatedDeck';
import { CardRevealModal } from '../../../components/CardRevealModal';
import { GameCard } from '../../../components/GameCard';
import { GameModeSelector } from '../../../components/GameModeSelector';
import { GameRulesModal } from '../../../components/GameRulesModal';
import { GameStatusPanel } from '../../../components/GameStatusPanel';
import { RoundVoteModal } from '../../../components/RoundVoteModal';
import { AuthUserContext } from '../../../context/AuthUserProvider';
import { FirestoreManager, FirestorePlayerData } from '../../../game/FirestoreManager';
import { GameManager } from '../../../game/GameManager';
import { GameState, Player, PlayerHand } from '../../../game/types';
import { WhatsAppBridge } from '../../../game/WhatsAppBridge';
import { useFirestoreSync } from '../../../hooks/useFirestoreSync';


function getTimeFromPossibleTimestamp(value: any) {
  if (!value) return Date.now();

  if (typeof value?.toDate === 'function') {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return new Date(value).getTime();
}

const MAX_PLAYERS = 12;
const MIN_PLAYERS_TO_START = 2;
const SOLO_DECK_PRESETS = [
  { label: 'Ultra rápido', multiplier: 1, cards: 52 },
  { label: 'Rápido', multiplier: 2, cards: 104 },
  { label: 'Normal', multiplier: 3, cards: 156 },
  { label: 'Longo', multiplier: 4, cards: 208 },
  { label: 'Muito longo', multiplier: 5, cards: 260 },
  { label: 'Maratona', multiplier: 6, cards: 312 },
];

const NORMAL_DECK_PRESETS = [
  { label: 'Ultra rápido', multiplier: 1, cards: 52 },
  { label: 'Rápido', multiplier: 2, cards: 104 },
  { label: 'Normal', multiplier: 3, cards: 156 },
  { label: 'Longo', multiplier: 4, cards: 208 },
  { label: 'Muito longo', multiplier: 5, cards: 260 },
  { label: 'Maratona', multiplier: 6, cards: 312 },
];

const BONUS_DECK_PRESETS = [
  { label: 'Normal', multiplier: 1, cards: 104 },
  { label: 'Longo', multiplier: 2, cards: 208 },
  { label: 'Maratona', multiplier: 3, cards: 312 },
];

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

  const [gameMode, setGameMode] = useState<'normal' | 'bonus'>('normal');
  const [showRules, setShowRules] = useState(false);

  const [revealModalVisible, setRevealModalVisible] = useState(false);
  const [voteNow, setVoteNow] = useState(Date.now());

  const isJoinMode = params?.mode === 'join';
  const isSoloMode = params?.soloMode === 'true';
  const canStartGame = isSoloMode || currentPlayers >= MIN_PLAYERS_TO_START;
  const isHost = Boolean(user?.uid && gameManager?.getRoomConfig().hostId === user.uid);

  const [bathroomName, setBathroomName] = useState('');

  const [generalRuleText, setGeneralRuleText] = useState('');
  const [soloPlayerCount, setSoloPlayerCount] = useState(1);
  const [deckMultiplier, setDeckMultiplier] = useState(3);
  const [secretVoteEnabled, setSecretVoteEnabled] = useState(false);
  const [showSecretVoteInfo, setShowSecretVoteInfo] = useState(false);


  const currentGameMode = gameState?.roomConfig?.gameMode || gameMode;
  const shouldShowBonusRules = currentGameMode === 'bonus';

  useEffect(() => {
    if (!gameState?.roundVote?.active) return;

    const interval = setInterval(() => {
      const endsAt = gameState.roundVote?.endsAt;
      const endsAtTime = getTimeFromPossibleTimestamp(gameState?.roundVote?.endsAt);

      if (Date.now() >= endsAtTime) {
        clearInterval(interval);

        try {
          if (gameManager && isHost) {
            gameManager.finishRoundVote();
            updateGameState(gameManager);
          }
        } catch (error: any) {
          console.warn('Erro ao finalizar votação:', error?.message || error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.roundVote?.active, gameManager, isHost]);

  useEffect(() => {
    if (!gameState?.roundVote?.active) return;

    const interval = setInterval(() => {
      setVoteNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.roundVote?.active]);


  function getTimeFromPossibleTimestamp(value: any) {
    if (!value) return Date.now();

    if (typeof value?.toDate === 'function') {
      return value.toDate().getTime();
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    return new Date(value).getTime();
  }


  const roundVote = gameState?.roundVote;
  const roundVoteEndTime = getTimeFromPossibleTimestamp(roundVote?.endsAt);

  const voteSecondsLeft = Math.max(
    0,
    Math.ceil((roundVoteEndTime - voteNow) / 1000)
  );

  const currentUserVote = user?.uid && roundVote?.votes
    ? roundVote.votes[user.uid]
    : undefined;

  const playerListForVote = gameState
    ? Array.from(gameState.players.values()).map((player) => ({
      id: player.id,
      name: player.name,
    }))
    : [];

  const hasJoker = Boolean(
    playerHand?.items?.some((item: any) => item.actionType === 'joker')
  );

  const jokerUsed = Boolean(
    user?.uid && roundVote?.jokerUsers?.includes(user.uid)
  );

  const getCurrentActionPlayerId = () => {
    if (!user?.uid) return null;

    if (!isSoloMode) {
      return user.uid;
    }

    return (
      gameManager?.getGameState().currentTurn?.currentPlayerId ||
      gameState?.currentTurn?.currentPlayerId ||
      user.uid
    );
  };

  const handleGameModeChange = (mode: 'normal' | 'bonus') => {
    setGameMode(mode);

    if (mode === 'bonus') {
      setDeckMultiplier(1);
      return;
    }

    setDeckMultiplier(3);
  };

  const handleUseBathroomPass = (passId: string) => {
    try {
      if (!gameManager) {
        Alert.alert('Erro', 'GameManager não inicializado.');
        return;
      }

      gameManager.useBathroomPass(passId);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  const handleRemoveBathroomPass = (passId: string) => {
    try {
      if (!gameManager) {
        Alert.alert('Erro', 'GameManager não inicializado.');
        return;
      }

      gameManager.removeBathroomPass(passId);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  const handleAddBathroomUser = () => {
    const name = bathroomName.trim();

    if (!name) {
      Alert.alert('Nome obrigatório', 'Digite o nome da pessoa.');
      return;
    }

    try {
      const actionPlayerId = getCurrentActionPlayerId();

      if (!gameManager || !actionPlayerId) {
        Alert.alert('Erro', 'Jogo ou jogador não inicializado.');
        return;
      }

      gameManager.useBathroomFromDrawnCard(actionPlayerId, name);

      setBathroomName('');
      setRevealModalVisible(false);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };
  const handleAddGeneralRule = () => {
    const rule = generalRuleText.trim();

    if (!rule) {
      Alert.alert('Regra obrigatória', 'Digite a regra geral.');
      return;
    }

    try {
      const actionPlayerId = getCurrentActionPlayerId();

      if (!gameManager || !actionPlayerId) {
        Alert.alert('Erro', 'Jogo ou jogador não inicializado.');
        return;
      }

      gameManager.addGeneralRuleFromDrawnCard(actionPlayerId, rule);

      setGeneralRuleText('');
      setRevealModalVisible(false);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  const handleVoteForPlayer = (targetPlayerId: string) => {
    try {
      if (!gameManager || !user?.uid) return;

      gameManager.voteForPlayer(user.uid, targetPlayerId);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  const handleUseJokerVote = () => {
    try {
      if (!gameManager || !user?.uid) return;

      gameManager.useJokerInRoundVote(user.uid);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

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

    if (user?.uid) {
      const hand = manager.getPlayerHand(user.uid);
      setPlayerHand(hand || null);
    }
  };

  useFirestoreSync({
    roomId: roomId || null,
    gameManager,
    userId: user?.uid || null,
    enabled: Boolean(roomId && user?.uid && !isSoloMode),

    onRoomUpdate: (roomData) => {
      console.log('📝 Room atualizada via GameScreen:', roomData);

      if (roomData.status === 'in_progress' && roomData.gameState) {
        setGameStarted(true);

        if (gameManager) {
          const state = gameManager.getGameState();

          state.status = roomData.gameState.status || 'active';
          state.round = Number(roomData.gameState.round || 1);
          state.currentTurn = roomData.gameState.currentTurn || null;

          state.itemPool = Array.isArray(roomData.gameState.itemPool)
            ? roomData.gameState.itemPool
            : [];

          state.discardPile = Array.isArray(roomData.gameState.discardPile)
            ? roomData.gameState.discardPile
            : [];

          state.gameLog = Array.isArray(roomData.gameState.gameLog)
            ? roomData.gameState.gameLog
            : [];

          state.kingCupCount = Number(roomData.gameState.kingCupCount || 0);
          state.roomConfig.status = 'playing';
          state.roomConfig.gameMode = roomData.gameState.roomConfig?.gameMode || 'normal';
          state.roomConfig.secretVoteEnabled = Boolean(
            roomData.gameState.roomConfig?.secretVoteEnabled
          );

          state.roomConfig.deckMultiplier = Number(
            roomData.gameState.roomConfig?.deckMultiplier || 1
          );

          state.roomConfig.baseDeckCards = Number(
            roomData.gameState.roomConfig?.baseDeckCards || 52
          );

          setGameMode(state.roomConfig.gameMode || 'normal');
          setSecretVoteEnabled(Boolean(state.roomConfig.secretVoteEnabled));
          setDeckMultiplier(Number(state.roomConfig.deckMultiplier || 1));
          state.generalRules = Array.isArray(roomData.gameState.generalRules)
            ? roomData.gameState.generalRules
            : [];

          state.bathroomPasses = Array.isArray(roomData.gameState.bathroomPasses)
            ? roomData.gameState.bathroomPasses
            : [];

          if (Array.isArray(roomData.gameState.players)) {
            roomData.gameState.players.forEach((player: any) => {
              const playerId = player.id || player.userId;

              if (!playerId) return;

              state.players.set(playerId, {
                id: playerId,
                name: player.name || 'Jogador',
                email: player.email || '',
                phone: player.phone || '',
                joinedAt: player.joinedAt?.toDate?.() || new Date(),
                isActive: true,
              });
            });
          }

          if (Array.isArray(roomData.gameState.playerHands)) {
            state.playerHands.clear();

            roomData.gameState.playerHands.forEach((hand: any) => {
              if (!hand?.playerId) return;

              state.playerHands.set(hand.playerId, {
                playerId: hand.playerId,
                items: Array.isArray(hand.items) ? hand.items : [],
                isLeader: Boolean(hand.isLeader),
                score: Number(hand.score || 0),
              });
            });

            if (user?.uid) {
              setPlayerHand(state.playerHands.get(user.uid) || null);
            }
          }

          setGameState({ ...state });
        }
      }

      if (roomData.status === 'finished') {
        setGameStarted(false);
        Alert.alert('Jogo finalizado', 'A partida foi encerrada.');
      }
    },

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
            'waiting_room',
            MAX_PLAYERS,
            'normal',
            isSoloMode
          );

          const currentPlayer: Player = {
            id: user.uid,
            name: getPlayerName(),
            phone: params.phone || '',
            email: user.email,
            profileImage: user.photoURL || undefined,
            joinedAt: new Date(),
            isActive: true,
          };



          if (isSoloMode) {
            newGameManager.addPlayer(currentPlayer);

            setupGameEventListeners(newGameManager);

            setGameManager(newGameManager);
            setRoomId(newRoomId);
            setCurrentPlayers(1);
            setRoomPlayers([]);
            setGameStarted(false);
            updateGameState(newGameManager);
            setLoading(false);

            return;
          }

          newGameManager.addPlayer(currentPlayer);

          if (!isSoloMode) {

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
                  gameMode,
                  secretVoteEnabled,
                  deckMultiplier,
                  baseDeckCards: gameMode === 'bonus' ? deckMultiplier * 104 : deckMultiplier * 52,
                },
                user.uid
              );

              await FirestoreManager.syncHostPlayer(newRoomId, currentPlayer);

              console.log('✅ Sala criada e host sincronizado no Firestore:', newRoomId);
            } catch (error) {
              console.error('❌ Erro ao criar/sincronizar sala no Firestore:', error);
              Alert.alert('Erro', 'Não foi possível criar a sala.');
            }
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
            profileImage: user.photoURL || undefined,
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
              roomData.maxPlayers || MAX_PLAYERS,
              roomData.gameState?.roomConfig?.gameMode || 'normal'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    manager.on('card_drawn', () => {
      updateGameState(manager);
    });

    manager.on('card_kept', () => {
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
      const handPlayerId = isSoloMode
        ? state.currentTurn?.currentPlayerId || user.uid
        : user.uid;

      const hand = manager.getPlayerHand(handPlayerId);
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
    } catch {
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
      gameMode,
    });

    if (!isSoloMode && !canStartGame) {
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

      if (!isSoloMode) {
        syncGameManagerPlayersFromFirestore(gameManager, roomPlayers);
      }

      if (!isSoloMode && gameManager.getGameState().players.size < MIN_PLAYERS_TO_START) {
        Alert.alert(
          'Aguardando jogadores',
          `A sala mostra ${currentPlayers} jogador(es), mas a lista local ainda não sincronizou. Tente novamente em instantes.`
        );
        return;
      }
      if (isSoloMode && user?.uid) {
        const currentPlayer: Player = {
          id: user.uid,
          name: getPlayerName(),
          phone: params.phone || '',
          email: user.email,
          profileImage: user.photoURL || undefined,
          joinedAt: new Date(),
          isActive: true,
        };

        gameManager.configureSoloBeforeStart(
          currentPlayer,
          soloPlayerCount,
          deckMultiplier
        );
      }


      gameManager.getGameState().roomConfig.gameMode = gameMode;
      gameManager.getGameState().roomConfig.secretVoteEnabled = secretVoteEnabled;
      gameManager.getGameState().roomConfig.deckMultiplier = deckMultiplier;
      gameManager.getGameState().roomConfig.baseDeckCards =
        gameMode === 'bonus'
          ? deckMultiplier * 104
          : deckMultiplier * 52;
      gameManager.startGame();

      setGameStarted(true);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  const handleDrawCard = () => {
    try {
      const actionPlayerId = getCurrentActionPlayerId();

      if (!gameManager || !actionPlayerId) {
        Alert.alert('Erro', 'Jogo ou usuário não inicializado.');
        return;
      }

      gameManager.drawCard(actionPlayerId);
      updateGameState(gameManager);

      setTimeout(() => {
        setRevealModalVisible(true);
      }, 120);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  const handlePlayDrawnCard = () => {
    try {
      const actionPlayerId = getCurrentActionPlayerId();

      if (!gameManager || !actionPlayerId) {
        Alert.alert('Erro', 'Jogo ou usuário não inicializado.');
        return;
      }

      gameManager.playDrawnCard(actionPlayerId);
      setRevealModalVisible(false);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  const handleKeepDrawnCard = () => {
    try {
      const actionPlayerId = getCurrentActionPlayerId();

      if (!gameManager || !actionPlayerId) {
        Alert.alert('Erro', 'Jogo ou usuário não inicializado.');
        return;
      }

      gameManager.keepDrawnCard(actionPlayerId);
      setRevealModalVisible(false);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };
  const handleTradeBathroomCard = () => {
    try {
      const actionPlayerId = getCurrentActionPlayerId();

      if (!gameManager || !actionPlayerId) {
        Alert.alert('Erro', 'Jogo ou usuário não inicializado.');
        return;
      }

      gameManager.tradeBathroomCard(actionPlayerId);
      setRevealModalVisible(false);
      updateGameState(gameManager);
    } catch (error: any) {
      Alert.alert('Erro', error?.message || String(error));
    }
  };

  const handlePlaySavedCard = (cardId: string) => {
    try {
      const actionPlayerId = getCurrentActionPlayerId();

      if (!gameManager || !actionPlayerId) {
        Alert.alert('Erro', 'Jogo ou usuário não inicializado.');
        return;
      }

      gameManager.playSavedCard(actionPlayerId, cardId);
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

    const deckPresetsForCurrentMode = isSoloMode
      ? SOLO_DECK_PRESETS
      : gameMode === 'bonus'
        ? BONUS_DECK_PRESETS
        : NORMAL_DECK_PRESETS;

    const selectedDeckPreset =
      deckPresetsForCurrentMode.find((preset) => preset.multiplier === deckMultiplier) ||
      deckPresetsForCurrentMode[0];

    const estimatedCards =
      gameMode === 'bonus'
        ? deckMultiplier * 104
        : deckMultiplier * 52;

    const canEditMatchConfig = isSoloMode || isHost;

    return (
      <SafeAreaView style={styles.container}>
        <GameRulesModal
          visible={showRules}
          isSoloMode={isSoloMode}
          gameMode={currentGameMode}
          showBonus={shouldShowBonusRules}
          onClose={() => setShowRules(false)}
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Image
              source={require('../../../assets/images/logo/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>
              {isSoloMode ? 'Modo Solo' : 'Sala de Espera'}
            </Text>

            <Text style={styles.subtitle}>
              {isSoloMode
                ? 'Jogo local no mesmo celular.'
                : `Você está como: ${getPlayerName()}`}
            </Text>

            {!isSoloMode && <Text style={styles.roomId}>Código: {roomId}</Text>}

            {!isSoloMode && (
              <View style={styles.playerCountContainer}>
                <Text style={styles.playerCount}>
                  Jogadores: {currentPlayers}/
                  {gameManager?.getRoomConfig().maxPlayers || MAX_PLAYERS}
                </Text>
              </View>
            )}

            {!isSoloMode && (
              <View style={styles.playersListContainer}>
                <Text style={styles.playersTitle}>Jogadores na Sala</Text>

                {playersToRender.length > 0 ? (
                  playersToRender.map((player) => (
                    <View key={player.userId} style={styles.playerItem}>
                      <Text style={styles.playerName}>{player.name}</Text>

                      {gameManager &&
                        player.userId === gameManager.getRoomConfig().hostId && (
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
            )}

            {isSoloMode && (
              <View style={styles.soloInfoBox}>
                <Text style={styles.soloInfoTitle}>Como funciona</Text>
                <Text style={styles.soloInfoText}>
                  Uma pessoa controla o celular e passa para o próximo jogador a cada turno.
                </Text>
              </View>
            )}

            <View style={styles.matchConfigScreen}>
              <View style={styles.matchConfigHeader}>
                <Text style={styles.matchConfigEyebrow}>Configuração da partida</Text>

                <Text style={styles.matchConfigTitle}>
                  {isSoloMode ? 'Monte seu jogo local' : 'Prepare a sala'}
                </Text>

                <Text style={styles.matchConfigSubtitle}>
                  {canEditMatchConfig
                    ? 'Ajuste as regras antes de iniciar.'
                    : 'Aguardando o host configurar e iniciar a partida.'}
                </Text>
              </View>

              <View style={styles.matchConfigCard}>
                <Text style={styles.matchSectionTitle}>Modo de jogo</Text>

                {canEditMatchConfig ? (
                  <GameModeSelector gameMode={gameMode} onChange={handleGameModeChange} />
                ) : (
                  <View style={styles.readOnlyConfigBox}>
                    <Text style={styles.readOnlyConfigLabel}>
                      {currentGameMode === 'bonus' ? 'Com Bônus' : 'Normal'}
                    </Text>
                    <Text style={styles.readOnlyConfigText}>
                      Apenas o host pode alterar o modo de jogo.
                    </Text>
                  </View>
                )}

                {isSoloMode && (
                  <>
                    <View style={styles.matchDivider} />

                    <View style={styles.matchSectionHeader}>
                      <Text style={styles.matchSectionTitle}>Quantidade de pessoas</Text>
                      <Text style={styles.matchSectionValue}>{soloPlayerCount}</Text>
                    </View>

                    {canEditMatchConfig ? (
                      <View style={styles.inlineOptionsWrap}>
                        {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
                          <TouchableOpacity
                            key={count}
                            style={[
                              styles.inlineOptionButton,
                              soloPlayerCount === count && styles.inlineOptionButtonActive,
                            ]}
                            onPress={() => setSoloPlayerCount(count)}
                            activeOpacity={0.85}
                          >
                            <Text
                              style={[
                                styles.inlineOptionText,
                                soloPlayerCount === count && styles.inlineOptionTextActive,
                              ]}
                            >
                              {count}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.readOnlyConfigBox}>
                        <Text style={styles.readOnlyConfigLabel}>
                          {soloPlayerCount} pessoa(s)
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {!isSoloMode && (
                  <>
                    <View style={styles.matchDivider} />

                    <View style={styles.matchSectionHeader}>
                      <Text style={styles.matchSectionTitle}>Jogadores</Text>
                      <Text style={styles.matchSectionValue}>
                        {currentPlayers}/{gameManager?.getRoomConfig().maxPlayers || MAX_PLAYERS}
                      </Text>
                    </View>

                    <Text style={styles.matchHelperText}>
                      O jogo online precisa de pelo menos {MIN_PLAYERS_TO_START} jogadores para começar.
                    </Text>
                  </>
                )}

                <View style={styles.matchDivider} />

                <View style={styles.matchSectionHeader}>
                  <Text style={styles.matchSectionTitle}>Quantidade de cartas</Text>
                  <Text style={styles.matchSectionValue}>
                    {selectedDeckPreset?.cards || estimatedCards}
                  </Text>
                </View>

                <View style={styles.deckPresetList}>
                  {deckPresetsForCurrentMode.map((preset) => (
                    <TouchableOpacity
                      key={`${gameMode}-${preset.multiplier}`}
                      style={[
                        styles.deckPresetButton,
                        deckMultiplier === preset.multiplier && styles.deckPresetButtonActive,
                        !canEditMatchConfig && styles.disabledConfigOption,
                      ]}
                      onPress={() => {
                        if (!canEditMatchConfig) return;
                        setDeckMultiplier(preset.multiplier);
                      }}
                      disabled={!canEditMatchConfig}
                      activeOpacity={0.85}
                    >
                      <View>
                        <Text
                          style={[
                            styles.deckPresetTitle,
                            deckMultiplier === preset.multiplier && styles.deckPresetTitleActive,
                          ]}
                        >
                          {preset.label}
                        </Text>

                        <Text
                          style={[
                            styles.deckPresetSubtitle,
                            deckMultiplier === preset.multiplier && styles.deckPresetSubtitleActive,
                          ]}
                        >
                          {preset.cards} cartas
                          {gameMode === 'bonus' ? ' + coringas' : ''}
                        </Text>
                      </View>

                      {deckMultiplier === preset.multiplier && (
                        <FontAwesome name="check-circle" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.matchConfigSummary}>
                  {gameMode === 'bonus'
                    ? `Modo bônus com ${selectedDeckPreset?.cards || estimatedCards} cartas base e coringas extras.`
                    : `Modo normal com ${selectedDeckPreset?.cards || estimatedCards} cartas.`}
                </Text>

                {!isSoloMode && (
                  <>
                    <View style={styles.matchDivider} />

                    <View style={styles.secretVoteRow}>
                      <TouchableOpacity
                        style={[
                          styles.secretVoteToggle,
                          secretVoteEnabled && styles.secretVoteToggleActive,
                          !canEditMatchConfig && styles.disabledConfigOption,
                        ]}
                        onPress={() => {
                          if (!canEditMatchConfig) return;
                          setSecretVoteEnabled((prev) => !prev);
                        }}
                        disabled={!canEditMatchConfig}
                        activeOpacity={0.85}
                      >
                        <FontAwesome
                          name={secretVoteEnabled ? 'check-square-o' : 'square-o'}
                          size={18}
                          color={secretVoteEnabled ? '#fff' : '#333'}
                        />

                        <Text
                          style={[
                            styles.secretVoteToggleText,
                            secretVoteEnabled && styles.secretVoteToggleTextActive,
                          ]}
                        >
                          Voto secreto {secretVoteEnabled ? 'ligado' : 'desligado'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.secretVoteHelpButton}
                        onPress={() => setShowSecretVoteInfo((prev) => !prev)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.secretVoteHelpText}>?</Text>
                      </TouchableOpacity>
                    </View>

                    {showSecretVoteInfo && (
                      <Text style={styles.secretVoteInfoText}>
                        Fim de cada rodada: todos votam em segredo. O mais votado bebe 1.
                        Em empate, todos os empatados bebem. No bônus, coringas guardados aumentam a dose.
                      </Text>
                    )}
                  </>
                )}
              </View>

              {!isSoloMode && isHost && (
                <View style={styles.hostInviteBox}>
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
                </View>
              )}

              <View style={styles.matchActionsBox}>
                <TouchableOpacity
                  style={[styles.button, styles.rulesButton]}
                  onPress={() => setShowRules(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>
                    {shouldShowBonusRules ? 'VER REGRAS E BÔNUS' : 'VER REGRAS'}
                  </Text>
                </TouchableOpacity>

                {canEditMatchConfig ? (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.startButton,
                      !canStartGame && !isSoloMode && styles.disabledButton,
                    ]}
                    onPress={handleStartGame}
                    disabled={!canStartGame && !isSoloMode}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>COMEÇAR JOGO</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.waitingCard}>
                    <Text style={styles.waitingText}>
                      Aguardando o host iniciar o jogo...
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isSoloMode ? 'SAIR DO MODO SOLO' : 'SAIR DA SALA'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isMyTurn = gameState?.currentTurn?.currentPlayerId === user.uid;
  const currentTurnPlayerName =
    gameState?.players.get(gameState?.currentTurn?.currentPlayerId || '')?.name ||
    'Jogador';
  const drawnCard = gameState?.currentTurn?.drawnCard || null;

  return (
    <SafeAreaView style={styles.container}>
      <GameRulesModal
        visible={showRules}
        isSoloMode={isSoloMode}
        gameMode={gameState?.roomConfig?.gameMode || gameMode}
        onClose={() => setShowRules(false)}
      />
      <CardRevealModal
        visible={revealModalVisible && Boolean(drawnCard) && (isSoloMode || isMyTurn)}
        card={drawnCard}
        savedCard={isSoloMode ? null : playerHand?.items?.[0] || null}
        isMyTurn={isSoloMode ? true : isMyTurn}
        hasSavedCard={isSoloMode ? false : (playerHand?.items.length || 0) >= 1}
        soloMode={isSoloMode}
        gameMode={gameMode}

        bathroomName={bathroomName}
        onBathroomNameChange={setBathroomName}
        onSaveBathroomName={handleAddBathroomUser}

        generalRuleText={generalRuleText}
        onGeneralRuleTextChange={setGeneralRuleText}
        onSaveGeneralRule={handleAddGeneralRule}

        onUseNow={handlePlayDrawnCard}
        onKeep={handleKeepDrawnCard}
        onTradeBathroom={handleTradeBathroomCard}
        onClose={() => setRevealModalVisible(false)}
      />
      <RoundVoteModal
        visible={Boolean(gameState?.roundVote?.active)}
        players={playerListForVote}
        currentUserId={user.uid}
        selectedVote={currentUserVote}
        hasJoker={hasJoker}
        jokerUsed={jokerUsed}
        secondsLeft={voteSecondsLeft}
        onVote={handleVoteForPlayer}
        onUseJoker={handleUseJokerVote}
        gameMode={gameState?.roomConfig?.gameMode || gameMode}
        result={gameState?.roundVote?.result}
      />
      <ScrollView contentContainerStyle={styles.gameScrollContent}>
        <View style={styles.gameContainer}>
          {!isSoloMode ? (
            <GameStatusPanel
              round={gameState?.round || 1}
              mode={gameState?.roomConfig?.gameMode || 'normal'}
              currentPlayerName={currentTurnPlayerName}
              isMyTurn={isMyTurn}
              cardsLeft={gameState?.itemPool?.length || 0}
              kingCupCount={gameState?.kingCupCount || 0}
            />
          ) : (
            <View style={styles.soloGameStatus}>
              <Text style={styles.soloGameTitle}>Modo Solo</Text>
              <Text style={styles.soloGameSubtitle}>
                {gameState?.itemPool?.length || 0} cartas no monte
              </Text>
            </View>
          )}

          {isSoloMode && gameStarted && gameState && (
            <View
              style={[
                styles.kingCupSoloBox,
                gameState.kingCupCount >= 4 && styles.kingCupSoloBoxDanger,
              ]}
            >
              <View style={styles.kingCupSoloHeader}>
                <Text style={styles.kingCupSoloIcon}>👑</Text>

                <View style={styles.kingCupSoloTextBox}>
                  <Text style={styles.kingCupSoloTitle}>Rei do Copo</Text>

                  <Text
                    style={[
                      styles.kingCupSoloCounter,
                      gameState.kingCupCount >= 4 && styles.kingCupSoloCounterDanger,
                    ]}
                  >
                    Reis do Copo: {Math.min(gameState.kingCupCount || 0, 4)}/4
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.kingCupSoloDescription,
                  gameState.kingCupCount >= 4 && styles.kingCupSoloDescriptionDanger,
                ]}
              >
                {gameState.kingCupCount >= 4
                  ? '4º Rei! Vire o copo central.'
                  : 'Os 3 primeiros reis colocam bebida no copo. O 4º vira tudo.'}
              </Text>
            </View>
          )}

          {isSoloMode && gameStarted && gameState?.currentTurn && (
            <View style={styles.soloTurnBox}>
              <Text style={styles.soloTurnLabel}>Vez de</Text>

              <Text style={styles.soloTurnPlayer}>
                {gameState.players.get(gameState.currentTurn.currentPlayerId)?.name || 'Jogador'}
              </Text>

              <Text style={styles.soloTurnHint}>
                Passe o celular para essa pessoa jogar.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.rulesButton]}
            onPress={() => setShowRules(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{shouldShowBonusRules ? 'VER REGRAS E BÔNUS' : 'VER REGRAS'}</Text>
          </TouchableOpacity>

          <View style={styles.tableArea}>
            <Text style={styles.tableTitle}>Mesa central</Text>

            <AnimatedDeck
              isMyTurn={isSoloMode ? true : isMyTurn}
              hasDrawnCard={Boolean(drawnCard)}
              cardsLeft={gameState?.itemPool?.length || 0}
              onDraw={handleDrawCard}
            />
          </View>

          {drawnCard && isMyTurn && (
            <TouchableOpacity
              style={styles.reopenRevealButton}
              onPress={() => setRevealModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.reopenRevealText}>
                Ver sua carta revelada
              </Text>
            </TouchableOpacity>
          )}

          {drawnCard && !isMyTurn && (
            <View style={styles.hiddenCardNotice}>
              <Text style={styles.hiddenCardTitle}>
                {currentTurnPlayerName} comprou uma carta
              </Text>
              <Text style={styles.hiddenCardText}>
                A carta só será revelada quando for usada.
              </Text>
            </View>
          )}

          {!isSoloMode && (

            <View style={styles.handContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.handTitle}>Cartas guardadas</Text>

                <View style={styles.handBadge}>
                  <Text style={styles.handBadgeText}>
                    {playerHand?.items.length || 0}
                  </Text>
                </View>
              </View>

              {playerHand?.items?.length ? (
                <ScrollView
                  horizontal
                  style={styles.cardsScroll}
                  contentContainerStyle={styles.cardsScrollContent}
                  showsHorizontalScrollIndicator={false}
                >
                  {playerHand.items.map((item: any) => (
                    <GameCard
                      key={item.id}
                      item={item}
                      selected={selectedCard?.id === item.id}
                      onPress={() => setSelectedCard(item)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyHandBox}>
                  <Text style={styles.emptyHandIcon}>🃏</Text>
                  <Text style={styles.emptyHandText}>
                    Você ainda não guardou nenhuma carta.
                  </Text>
                  <Text style={styles.emptyHandHint}>
                    Compre uma carta na sua vez e escolha “Guardar”.
                  </Text>
                </View>
              )}
            </View>
          )}




          {!isSoloMode && selectedCard && (
            <View style={styles.selectedCardActions}>
              <View style={styles.selectedCardInfo}>
                <Text style={styles.selectedCardLabel}>Carta selecionada</Text>
                <Text style={styles.selectedCardName}>{selectedCard.name}</Text>
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.useNowButton]}
                  onPress={() => handlePlaySavedCard(selectedCard.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>USAR GUARDADA</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setSelectedCard(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>CANCELAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isSoloMode && gameState?.bathroomPasses?.length ? (
            <View style={styles.soloListBox}>
              <Text style={styles.soloListTitle}>🚻 Cartas Banheiro</Text>

              {gameState.bathroomPasses.map((pass, index) => (
                <View key={pass.id} style={styles.bathroomPassItem}>
                  <View style={styles.bathroomPassInfo}>
                    <Text style={styles.bathroomPassName}>
                      {index + 1}. {pass.name}
                    </Text>

                    <Text style={styles.bathroomPassMeta}>
                      Carta Banheiro disponível
                    </Text>
                  </View>

                  <View style={styles.bathroomPassActions}>
                    <TouchableOpacity
                      style={[styles.bathroomPassButton, styles.bathroomPassUseButton]}
                      onPress={() => handleUseBathroomPass(pass.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.bathroomPassButtonText}>Usou</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.bathroomPassButton, styles.bathroomPassRemoveButton]}
                      onPress={() => handleRemoveBathroomPass(pass.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.bathroomPassButtonText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {gameState?.generalRules?.length ? (
            <View style={styles.soloListBox}>
              <Text style={styles.soloListTitle}>📜 Regras Gerais Ativas</Text>

              {gameState.generalRules.map((rule, index) => (
                <View key={rule.id} style={styles.soloListItem}>
                  <Text style={styles.soloListItemText}>
                    {index + 1}. {rule.text}
                  </Text>

                  <Text style={styles.soloListItemMeta}>
                    Criada por {rule.playerName}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.logContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.logTitle}>Histórico</Text>
              <Text style={styles.logSubtitle}>últimas ações</Text>
            </View>

            {gameState?.gameLog?.length ? (
              gameState.gameLog.slice(0, 5).map((log: any) => (
                <View key={log.id} style={styles.logItem}>
                  <Text style={styles.logBullet}>•</Text>
                  <Text style={styles.logText}>{log.description}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyLogBox}>
                <Text style={styles.logText}>Nenhuma ação ainda.</Text>
              </View>
            )}
          </View>

          {!isSoloMode && isHost && gameState && (
            <View style={styles.hostPanel}>
              <Text style={styles.hostPanelTitle}>Controles do host</Text>

              {Array.from(gameState.players.values())
                .filter((player) => player.id !== user.uid)
                .map((player) => (
                  <View key={player.id} style={styles.hostPlayerRow}>
                    <Text style={styles.hostPlayerName}>{player.name}</Text>

                    <TouchableOpacity
                      style={[styles.hostSmallButton, styles.hostTransferButton]}
                      onPress={() => {
                        try {
                          gameManager?.transferHost(user.uid, player.id);
                          updateGameState(gameManager!);
                        } catch (error: any) {
                          Alert.alert('Erro', error?.message || String(error));
                        }
                      }}
                    >
                      <Text style={styles.hostSmallButtonText}>Host</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.hostSmallButton, styles.hostKickButton]}
                      onPress={() => {
                        Alert.alert(
                          'Banir jogador?',
                          `Remover ${player.name} da partida?`,
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Banir',
                              style: 'destructive',
                              onPress: () => {
                                try {
                                  gameManager?.kickPlayerByHost(user.uid, player.id);
                                  updateGameState(gameManager!);
                                } catch (error: any) {
                                  Alert.alert('Erro', error?.message || String(error));
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.hostSmallButtonText}>Banir</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.dangerButton, styles.exitGameButton]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>SAIR DA PARTIDA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4eff8',
  },

  scrollContent: {
    flexGrow: 1,
  },

  gameScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  content: {
    flex: 1,
    width: '100%',
    padding: 20,
    justifyContent: 'flex-start',
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
    color: '#7c3aed',
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
    backgroundColor: '#7c3aed',
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
    backgroundColor: '#7c3aed',
    padding: 15,
    borderRadius: 14,
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

  rulesButton: {
    backgroundColor: '#8E44AD',
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
    fontWeight: '900',
    textAlign: 'center',
  },

  tableArea: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eadcf5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  tableTitle: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  drawnCardBox: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eadcf5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  drawnLabel: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  revealedCardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  ruleInfoBox: {
    width: '100%',
    backgroundColor: '#f7f1fb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  ruleCardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2b1233',
    textAlign: 'center',
  },

  ruleCardDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },

  handContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    borderColor: '#eadcf5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  handTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2b1233',
  },

  handBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
  },

  handBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },

  cardsScroll: {
    minHeight: 180,
  },

  cardsScrollContent: {
    paddingRight: 12,
  },

  emptyHandBox: {
    backgroundColor: '#f7f1fb',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#eadcf5',
    alignItems: 'center',
  },

  emptyHandIcon: {
    fontSize: 34,
    marginBottom: 8,
  },

  emptyHandText: {
    color: '#2b1233',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyHandHint: {
    color: '#777',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },

  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
    width: '100%',
  },

  actionButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
  },

  useNowButton: {
    backgroundColor: '#34C759',
  },

  keepButton: {
    backgroundColor: '#5856D6',
  },

  cancelButton: {
    backgroundColor: '#FF3B30',
  },

  actionButtonText: {
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
    fontSize: 13,
  },

  selectedCardActions: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eadcf5',
  },

  selectedCardInfo: {
    marginBottom: 10,
  },

  selectedCardLabel: {
    fontSize: 12,
    color: '#777',
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  selectedCardName: {
    fontSize: 17,
    color: '#2b1233',
    fontWeight: '900',
    marginTop: 2,
  },

  logContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#eadcf5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  logTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2b1233',
  },

  logSubtitle: {
    fontSize: 12,
    color: '#777',
    fontWeight: '700',
  },

  logItem: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },

  logBullet: {
    color: '#7c3aed',
    fontSize: 16,
    lineHeight: 19,
  },

  logText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },

  emptyLogBox: {
    backgroundColor: '#f7f1fb',
    borderRadius: 12,
    padding: 12,
  },

  exitGameButton: {
    marginTop: 16,
  },

  reopenRevealButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#eadcf5',
    alignItems: 'center',
  },

  reopenRevealText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  hiddenCardNotice: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#eadcf5',
    alignItems: 'center',
  },

  hiddenCardTitle: {
    color: '#2b1233',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },

  hiddenCardText: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  hostPanel: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#eadcf5',
  },

  hostPanelTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2b1233',
    marginBottom: 10,
  },

  hostPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  hostPlayerName: {
    flex: 1,
    color: '#333',
    fontWeight: '800',
  },

  hostSmallButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },

  hostTransferButton: {
    backgroundColor: '#5856D6',
  },

  hostKickButton: {
    backgroundColor: '#FF3B30',
  },

  hostSmallButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  soloInfoBox: {
    width: '100%',
    backgroundColor: '#f7f1fb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eadcf5',
  },

  soloInfoTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2b1233',
    textAlign: 'center',
    marginBottom: 5,
  },

  soloInfoText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  soloGameStatus: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#eadcf5',
    alignItems: 'center',
  },

  soloGameTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2b1233',
  },

  soloGameSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  soloListBox: {
    backgroundColor: '#fff7e6',
    borderWidth: 1,
    borderColor: '#ffd280',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },

  soloListTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#7a4d00',
    marginBottom: 8,
  },

  soloListItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },

  soloListItemText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '700',
  },

  soloListItemMeta: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
  },
  bathroomPassItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e8e0ef',
  },

  bathroomPassInfo: {
    marginBottom: 8,
  },

  bathroomPassName: {
    color: '#333',
    fontSize: 14,
    fontWeight: '900',
  },

  bathroomPassMeta: {
    color: '#777',
    fontSize: 12,
    marginTop: 3,
  },

  bathroomPassActions: {
    flexDirection: 'row',
    gap: 8,
  },

  bathroomPassButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },

  bathroomPassUseButton: {
    backgroundColor: '#34C759',
  },

  bathroomPassRemoveButton: {
    backgroundColor: '#FF3B30',
  },

  bathroomPassButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  kingCupSoloBox: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#f5c542',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  kingCupSoloBoxDanger: {
    backgroundColor: '#ffe8e8',
    borderColor: '#ff3b30',
  },

  kingCupSoloHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  kingCupSoloIcon: {
    fontSize: 34,
    marginRight: 12,
  },

  kingCupSoloTextBox: {
    flex: 1,
  },

  kingCupSoloTitle: {
    fontSize: 15,
    color: '#7a4d00',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  kingCupSoloCounter: {
    fontSize: 20,
    color: '#2b1233',
    fontWeight: '900',
    marginTop: 2,
  },

  kingCupSoloCounterDanger: {
    color: '#b00020',
  },

  kingCupSoloDescription: {
    color: '#7a4d00',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    fontWeight: '700',
  },

  kingCupSoloDescriptionDanger: {
    color: '#b00020',
  },
  soloSetupBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#eadcf5',
  },

  soloSetupTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2b1233',
    marginBottom: 12,
    textAlign: 'center',
  },

  soloSetupLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#333',
    marginTop: 10,
    marginBottom: 8,
  },

  soloPlayerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  soloPlayerButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },

  soloPlayerButtonActive: {
    backgroundColor: '#8E44AD',
    borderColor: '#8E44AD',
  },

  soloPlayerButtonText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '900',
  },

  soloPlayerButtonTextActive: {
    color: '#fff',
  },

  deckPresetList: {
    gap: 8,
  },

  deckPresetButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  deckPresetButtonActive: {
    backgroundColor: '#8E44AD',
    borderColor: '#8E44AD',
  },

  deckPresetTitle: {
    color: '#333',
    fontSize: 15,
    fontWeight: '900',
  },

  deckPresetTitleActive: {
    color: '#fff',
  },

  deckPresetSubtitle: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '700',
  },

  deckPresetSubtitleActive: {
    color: '#f3e8ff',
  },

  soloSetupSummary: {
    marginTop: 12,
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '700',
  },

  soloTurnBox: {
    backgroundColor: '#f7f1fb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eadcf5',
    alignItems: 'center',
  },

  soloTurnLabel: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  soloTurnPlayer: {
    color: '#2b1233',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
    textAlign: 'center',
  },

  soloTurnHint: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  onlineSetupBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#eadcf5',
  },

  onlineSetupTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#2b1233',
    marginBottom: 12,
    textAlign: 'center',
  },

  onlineSetupLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#333',
    marginTop: 10,
    marginBottom: 8,
  },

  secretVoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },

  secretVoteToggle: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  secretVoteToggleActive: {
    backgroundColor: '#8E44AD',
    borderColor: '#8E44AD',
  },

  secretVoteToggleText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '900',
  },

  secretVoteToggleTextActive: {
    color: '#fff',
  },

  secretVoteHelpButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2b1233',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secretVoteHelpText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },

  secretVoteInfoText: {
    marginTop: 10,
    color: '#666',
    fontSize: 12,
    lineHeight: 17,
    backgroundColor: '#f7f1fb',
    borderRadius: 12,
    padding: 10,
  },
  matchConfigScreen: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
  },

  matchConfigHeader: {
    width: '100%',
    backgroundColor: '#2b1233',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },

  matchConfigEyebrow: {
    color: '#d8b4fe',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 6,
  },

  matchConfigTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },

  matchConfigSubtitle: {
    color: '#f3e8ff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },

  matchConfigCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eadcf5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  matchSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  matchSectionTitle: {
    color: '#2b1233',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
  },

  matchSectionValue: {
    color: '#7c3aed',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
  },

  matchDivider: {
    height: 1,
    backgroundColor: '#eadcf5',
    marginVertical: 14,
  },

  matchHelperText: {
    color: '#777',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },

  matchConfigSummary: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
    backgroundColor: '#f7f1fb',
    borderRadius: 14,
    padding: 10,
  },

  matchActionsBox: {
    width: '100%',
    marginBottom: 4,
  },

  hostInviteBox: {
    width: '100%',
    marginBottom: 6,
  },

  readOnlyConfigBox: {
    backgroundColor: '#f7f1fb',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eadcf5',
  },

  readOnlyConfigLabel: {
    color: '#2b1233',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },

  readOnlyConfigText: {
    color: '#777',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },

  inlineOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  inlineOptionButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },

  inlineOptionButtonActive: {
    backgroundColor: '#8E44AD',
    borderColor: '#8E44AD',
  },

  inlineOptionText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '900',
  },

  inlineOptionTextActive: {
    color: '#fff',
  },

  disabledConfigOption: {
    opacity: 0.55,
  },
});

export default GameScreen;