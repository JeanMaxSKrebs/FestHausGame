/**
 * Firestore Manager - Sincronização em Tempo Real
 * Gerencia persistência e sync de estado de jogo via Firestore
 */

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { GameState, Item, Player, RoomConfig } from './types';

export interface FirestoreRoomData {
  roomId: string;
  roomType: 'waiting_room' | 'direct_invite';
  createdBy: string;
  createdAt: any;
  status: 'looking_for_players' | 'in_progress' | 'finished';
  maxPlayers: number;
  players: string[];
  gameState?: any;
}

export interface FirestorePlayerData {
  userId: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: any;
  score: number;
  isReady: boolean;
}

export interface FirestoreTurnData {
  leaderId: string;
  round: number;
  trumpCategory?: string;
  playedCards: { [playerId: string]: any };
  timestamp: any;
  winnerId?: string;
}

export class FirestoreManager {
  private static db = getFirestore();

  private static clean(value: any): any {
    if (value === undefined) return null;

    if (value instanceof Date) return value;

    if (value instanceof Timestamp) return value;

    if (Array.isArray(value)) {
      return value.map((item) => this.clean(item));
    }

    if (value instanceof Map) {
      const objectValue: Record<string, any> = {};

      value.forEach((mapValue, mapKey) => {
        objectValue[String(mapKey)] = this.clean(mapValue);
      });

      return objectValue;
    }

    if (value && typeof value === 'object') {
      const result: Record<string, any> = {};

      Object.entries(value).forEach(([key, val]) => {
        if (val !== undefined) {
          result[key] = this.clean(val);
        }
      });

      return result;
    }

    return value;
  }

  private static serializeItem(item: any) {
    if (!item) return null;

    return this.clean({
      id: item?.id || '',
      name: item?.name || '',
      category: item?.category || '',
      value: Number(item?.value || 0),
      isTrump: Boolean(item?.isTrump),
      ruleTitle: item?.ruleTitle || '',
      ruleDescription: item?.ruleDescription || '',
      actionType: item?.actionType || 'drink',
    });
  }

  private static serializePlayer(player: any) {
    return this.clean({
      id: player?.id || player?.userId || '',
      userId: player?.userId || player?.id || '',
      name: player?.name || 'Jogador',
      email: player?.email || '',
      phone: player?.phone || '',
      profileImage: player?.profileImage || null,
      joinedAt: player?.joinedAt || Timestamp.now(),
      isActive: player?.isActive !== false,
      isMidGameJoin: Boolean(player?.isMidGameJoin),
    });
  }

  private static serializePlayedCards(playedCards: any): Record<string, any> {
    const serialized: Record<string, any> = {};

    if (!playedCards) {
      return serialized;
    }

    if (playedCards instanceof Map) {
      playedCards.forEach((card: any, playerId: string) => {
        serialized[String(playerId)] = this.serializeItem(card);
      });

      return serialized;
    }

    if (Array.isArray(playedCards)) {
      playedCards.forEach((entry: any, index: number) => {
        if (entry?.playerId && entry?.card) {
          serialized[String(entry.playerId)] = this.serializeItem(entry.card);
        } else if (Array.isArray(entry) && entry.length >= 2) {
          serialized[String(entry[0])] = this.serializeItem(entry[1]);
        } else {
          serialized[String(index)] = this.serializeItem(entry);
        }
      });

      return serialized;
    }

    if (typeof playedCards === 'object') {
      Object.entries(playedCards).forEach(([playerId, card]) => {
        serialized[String(playerId)] = this.serializeItem(card);
      });

      return serialized;
    }

    return serialized;
  }

  private static serializeTurn(turn: any): any {
    if (!turn) {
      return null;
    }

    const serialized = {
      roundNumber: Number(turn.roundNumber || turn.round || 1),
      turnNumber: Number(turn.turnNumber || 1),

      leaderId: String(turn.leaderId || turn.currentPlayerId || ''),
      currentPlayerId: String(turn.currentPlayerId || turn.leaderId || ''),

      drawnCard: turn.drawnCard ? this.serializeItem(turn.drawnCard) : null,
      keptCard: turn.keptCard ? this.serializeItem(turn.keptCard) : null,
      playedCard: turn.playedCard ? this.serializeItem(turn.playedCard) : null,

      actionTaken: turn.actionTaken || 'skipped',
      timestamp: turn.timestamp || Timestamp.now(),
    };

    return this.clean(serialized);
  }

  private static serializeGameState(gameState: any) {
    const players =
      gameState?.players instanceof Map
        ? Array.from(gameState.players.values()).map((player: any) =>
          this.serializePlayer(player)
        )
        : Array.isArray(gameState?.players)
          ? gameState.players.map((player: any) => this.serializePlayer(player))
          : [];

    const playerHands =
      gameState?.playerHands instanceof Map
        ? Array.from(gameState.playerHands.entries()).map(([playerId, hand]: any) =>
          this.clean({
            playerId,
            items: Array.isArray(hand?.items)
              ? hand.items.map((item: any) => this.serializeItem(item))
              : [],
            isLeader: Boolean(hand?.isLeader),
            score: Number(hand?.score || 0),
          })
        )
        : Array.isArray(gameState?.playerHands)
          ? gameState.playerHands.map((hand: any) =>
            this.clean({
              playerId: hand?.playerId || '',
              items: Array.isArray(hand?.items)
                ? hand.items.map((item: any) => this.serializeItem(item))
                : [],
              isLeader: Boolean(hand?.isLeader),
              score: Number(hand?.score || 0),
            })
          )
          : [];

          

    const turns = Array.isArray(gameState?.turns)
      ? gameState.turns.map((turn: any) => this.serializeTurn(turn)).filter(Boolean)
      : [];

    const serializable = {
      roomId: gameState?.roomId || '',

      roomConfig: {
        roomId: gameState?.roomConfig?.roomId || gameState?.roomId || '',
        roomType: gameState?.roomConfig?.roomType || 'waiting_room',
        hostId: gameState?.roomConfig?.hostId || '',
        maxPlayers: Number(gameState?.roomConfig?.maxPlayers || 12),
        currentPlayers: Number(
          gameState?.roomConfig?.currentPlayers || players.length || 0
        ),
        status: gameState?.roomConfig?.status || 'playing',
        createdAt: gameState?.roomConfig?.createdAt || Timestamp.now(),
        startedAt: gameState?.roomConfig?.startedAt || Timestamp.now(),
        endedAt: gameState?.roomConfig?.endedAt || null,
        gameMode: gameState?.roomConfig?.gameMode || 'normal',
      },

      players,

      playerHands,

      itemPool: Array.isArray(gameState?.itemPool)
        ? gameState.itemPool.map((item: any) => this.serializeItem(item))
        : [],

      discardPile: Array.isArray(gameState?.discardPile)
        ? gameState.discardPile.map((item: any) => this.serializeItem(item))
        : [],

      currentTurn: gameState?.currentTurn
        ? this.serializeTurn(gameState.currentTurn)
        : null,

      turns,

      round: Number(gameState?.round || 1),

      gameHistory: Array.isArray(gameState?.gameHistory)
        ? gameState.gameHistory.map((turn: any) => this.serializeTurn(turn)).filter(Boolean)
        : [],

      gameLog: Array.isArray(gameState?.gameLog)
        ? gameState.gameLog.map((log: any) =>
          this.clean({
            id: log?.id || `log_${Date.now()}`,
            playerId: log?.playerId || '',
            playerName: log?.playerName || 'Jogador',
            card: log?.card ? this.serializeItem(log.card) : null,
            action: log?.action || '',
            description: log?.description || '',
            createdAt: log?.createdAt || Timestamp.now(),
          })
        )
        : [],

      status: gameState?.status || 'active',

      rankings: Array.isArray(gameState?.rankings)
        ? gameState.rankings
        : [],

      kingCupCount: Number(gameState?.kingCupCount || 0),
    };

    return this.clean(serializable);
  }

  static async createRoom(
    roomId: string,
    config: RoomConfig,
    userId: string
  ): Promise<void> {
    try {
      const roomData: FirestoreRoomData = {
        roomId,
        roomType: config.roomType,
        createdBy: userId,
        createdAt: Timestamp.now(),
        status: 'looking_for_players',
        maxPlayers: Number(config.maxPlayers || 12),
        players: [userId],
      };

      await setDoc(doc(this.db, 'rooms', roomId), roomData, { merge: true });

      console.log('✅ Room criada no Firestore:', roomId);
    } catch (error) {
      console.error('❌ Erro ao criar room:', error);
      throw error;
    }
  }

  static async syncHostPlayer(roomId: string, player: Player): Promise<void> {
    try {
      const roomRef = doc(this.db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error(`Sala ${roomId} ainda não existe para sincronizar o host.`);
      }

      const playerRef = doc(this.db, 'rooms', roomId, 'players', player.id);

      const playerData: FirestorePlayerData = {
        userId: player.id,
        name: player.name,
        email: player.email || '',
        phone: player.phone || '',
        joinedAt: Timestamp.now(),
        score: 0,
        isReady: true,
      };

      await setDoc(playerRef, playerData, { merge: true });

      const latestRoomSnap = await getDoc(roomRef);
      const latestRoomData = latestRoomSnap.data() as FirestoreRoomData | undefined;
      const latestPlayers = Array.isArray(latestRoomData?.players)
        ? latestRoomData.players
        : [];

      await updateDoc(roomRef, {
        players: latestPlayers.includes(player.id)
          ? latestPlayers
          : [...latestPlayers, player.id],
      });

      console.log('✅ Host sincronizado como player:', player.name);
    } catch (error) {
      console.error('❌ Erro ao sincronizar host:', error);
      throw error;
    }
  }

  static async joinRoom(roomId: string, player: Player): Promise<void> {
    try {
      const roomRef = doc(this.db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error(`Sala ${roomId} não encontrada.`);
      }

      const roomData = roomSnap.data() as FirestoreRoomData;

      if (roomData.status !== 'looking_for_players') {
        throw new Error('Essa sala já iniciou ou foi encerrada.');
      }

      const players = Array.isArray(roomData.players) ? roomData.players : [];
      const isAlreadyInRoom = players.includes(player.id);

      if (players.length >= roomData.maxPlayers && !isAlreadyInRoom) {
        throw new Error('Essa sala está cheia.');
      }

      const playerRef = doc(this.db, 'rooms', roomId, 'players', player.id);

      const playerData: FirestorePlayerData = {
        userId: player.id,
        name: player.name,
        email: player.email || '',
        phone: player.phone || '',
        joinedAt: Timestamp.now(),
        score: 0,
        isReady: false,
      };

      await setDoc(playerRef, playerData, { merge: true });

      const latestRoomSnap = await getDoc(roomRef);
      const latestRoomData = latestRoomSnap.data() as FirestoreRoomData | undefined;
      const latestPlayers = Array.isArray(latestRoomData?.players)
        ? latestRoomData.players
        : [];

      await updateDoc(roomRef, {
        players: latestPlayers.includes(player.id)
          ? latestPlayers
          : [...latestPlayers, player.id],
      });

      console.log('✅ Player entrou na sala:', player.name);
    } catch (error) {
      console.error('❌ Erro ao entrar na sala:', error);
      throw error;
    }
  }

  static async startGame(roomId: string, gameState: GameState | any): Promise<void> {
    try {
      const roomRef = doc(this.db, 'rooms', roomId);
      const serializableGameState = this.serializeGameState(gameState);

      await updateDoc(roomRef, {
        status: 'in_progress',
        gameState: serializableGameState,
      });

      if (serializableGameState.currentTurn) {
        await this.createTurn(roomId, serializableGameState.currentTurn);
      }

      console.log('✅ Jogo iniciado no Firestore');
    } catch (error) {
      console.error('❌ Erro ao iniciar jogo:', error);
      throw error;
    }
  }

  static async createTurn(roomId: string, turn: any): Promise<void> {
    try {
      const serializedTurn = this.serializeTurn(turn);
      const turnId = `turn_${serializedTurn?.roundNumber || 1}_${Date.now()}`;
      const turnRef = doc(this.db, 'rooms', roomId, 'turns', turnId);

      const turnData: FirestoreTurnData = {
        leaderId: serializedTurn?.leaderId || '',
        round: Number(serializedTurn?.roundNumber || 1),
        playedCards: serializedTurn?.playedCards || {},
        timestamp: Timestamp.now(),
      };

      if (serializedTurn?.trumpCategory) {
        turnData.trumpCategory = serializedTurn.trumpCategory;
      }

      if (serializedTurn?.winnerId) {
        turnData.winnerId = serializedTurn.winnerId;
      }

      await setDoc(turnRef, this.clean(turnData));

      console.log('✅ Turno criado:', turnId);
    } catch (error) {
      console.error('❌ Erro ao criar turno:', error);
      throw error;
    }
  }

  static async playCard(
    roomId: string,
    turnId: string,
    playerId: string,
    card: Item
  ): Promise<void> {
    try {
      const turnRef = doc(this.db, 'rooms', roomId, 'turns', turnId);

      await updateDoc(turnRef, {
        [`playedCards.${playerId}`]: this.serializeItem(card),
      });

      console.log('✅ Carta registrada:', card.name);
    } catch (error) {
      console.error('❌ Erro ao registrar carta:', error);
      throw error;
    }
  }

  static async endTurn(
    roomId: string,
    turnId: string,
    winnerId: string,
    scores: Map<string, number>
  ): Promise<void> {
    try {
      const turnRef = doc(this.db, 'rooms', roomId, 'turns', turnId);
      const batch = writeBatch(this.db);

      batch.update(turnRef, {
        winnerId,
      });

      for (const [playerId, score] of scores) {
        const playerRef = doc(this.db, 'rooms', roomId, 'players', playerId);

        batch.update(playerRef, {
          score,
        });
      }

      await batch.commit();

      console.log('✅ Turno finalizado:', winnerId, 'venceu');
    } catch (error) {
      console.error('❌ Erro ao finalizar turno:', error);
      throw error;
    }
  }

  static async updateGameState(roomId: string, gameState: any): Promise<void> {
    try {
      const roomRef = doc(this.db, 'rooms', roomId);
      const serializableGameState = this.serializeGameState(gameState);

      await updateDoc(roomRef, {
        status:
          serializableGameState.status === 'finished'
            ? 'finished'
            : 'in_progress',
        gameState: serializableGameState,
      });

      console.log('✅ Estado do jogo atualizado no Firestore');
    } catch (error) {
      console.error('❌ Erro ao atualizar estado do jogo:', error);
      throw error;
    }
  }

  static async finishGame(roomId: string, rankings: Player[]): Promise<void> {
    try {
      const roomRef = doc(this.db, 'rooms', roomId);

      await updateDoc(roomRef, {
        status: 'finished',
        rankings,
      });

      console.log('✅ Jogo finalizado');
    } catch (error) {
      console.error('❌ Erro ao finalizar jogo:', error);
      throw error;
    }
  }

  static listenToRoom(
    roomId: string,
    callback: (roomData: FirestoreRoomData) => void,
    onError?: (error: any) => void
  ): () => void {
    try {
      const roomRef = doc(this.db, 'rooms', roomId);

      return onSnapshot(
        roomRef,
        (documentSnapshot: any) => {
          if (documentSnapshot.exists()) {
            const data = documentSnapshot.data() as FirestoreRoomData;
            callback(data);
          }
        },
        (error: any) => {
          console.error('❌ Erro ao escutar sala:', error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.error('❌ Erro ao configurar listener de sala:', error);
      throw error;
    }
  }

  static listenToTurn(
    roomId: string,
    turnId: string,
    callback: (turnData: FirestoreTurnData) => void,
    onError?: (error: any) => void
  ): () => void {
    try {
      const turnRef = doc(this.db, 'rooms', roomId, 'turns', turnId);

      return onSnapshot(
        turnRef,
        (documentSnapshot: any) => {
          if (documentSnapshot.exists()) {
            const data = documentSnapshot.data() as FirestoreTurnData;
            callback(data);
          }
        },
        (error: any) => {
          console.error('❌ Erro ao escutar turno:', error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.error('❌ Erro ao configurar listener de turno:', error);
      throw error;
    }
  }

  static listenToPlayers(
    roomId: string,
    callback: (players: FirestorePlayerData[]) => void,
    onError?: (error: any) => void
  ): () => void {
    try {
      const playersRef = collection(this.db, 'rooms', roomId, 'players');

      return onSnapshot(
        playersRef,
        (snapshot: any) => {
          const players: FirestorePlayerData[] = [];

          snapshot.forEach((playerDoc: any) => {
            players.push(playerDoc.data() as FirestorePlayerData);
          });

          callback(players);
        },
        (error: any) => {
          console.error('❌ Erro ao escutar players:', error);
          onError?.(error);
        }
      );
    } catch (error) {
      console.error('❌ Erro ao configurar listener de players:', error);
      throw error;
    }
  }

  static async getRoom(roomId: string): Promise<FirestoreRoomData | null> {
    try {
      const roomRef = doc(this.db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        return roomSnap.data() as FirestoreRoomData;
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao obter sala:', error);
      return null;
    }
  }

  static async getPlayers(roomId: string): Promise<FirestorePlayerData[]> {
    try {
      const playersRef = collection(this.db, 'rooms', roomId, 'players');
      const playersSnap = await getDocs(playersRef);

      const players: FirestorePlayerData[] = [];

      playersSnap.forEach((playerDoc: any) => {
        players.push(playerDoc.data() as FirestorePlayerData);
      });

      return players;
    } catch (error) {
      console.error('❌ Erro ao obter players:', error);
      return [];
    }
  }

  static async leaveRoom(roomId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(this.db);

      const roomRef = doc(this.db, 'rooms', roomId);
      const playerRef = doc(this.db, 'rooms', roomId, 'players', userId);

      const roomData = await this.getRoom(roomId);
      const updatedPlayers = Array.isArray(roomData?.players)
        ? roomData.players.filter((id) => id !== userId)
        : [];

      batch.update(roomRef, {
        players: updatedPlayers,
      });

      batch.delete(playerRef);

      await batch.commit();

      console.log('✅ Player saiu da sala');
    } catch (error) {
      console.error('❌ Erro ao sair da sala:', error);
      throw error;
    }
  }

  static async validateRoomInvite(roomId: string): Promise<boolean> {
    try {
      const room = await this.getRoom(roomId);

      if (!room) {
        console.warn('⚠️ Sala não encontrada');
        return false;
      }

      if (room.status !== 'looking_for_players') {
        console.warn('⚠️ Sala já iniciou ou terminou');
        return false;
      }

      const players = Array.isArray(room.players) ? room.players : [];

      if (players.length >= room.maxPlayers) {
        console.warn('⚠️ Sala cheia');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao validar sala:', error);
      return false;
    }
  }

  static async updatePlayerScore(
    roomId: string,
    userId: string,
    score: number
  ): Promise<void> {
    try {
      const playerRef = doc(this.db, 'rooms', roomId, 'players', userId);
      await updateDoc(playerRef, { score });

      console.log('✅ Score atualizado:', score);
    } catch (error) {
      console.error('❌ Erro ao atualizar score:', error);
      throw error;
    }
  }

  static async markPlayerReady(roomId: string, userId: string): Promise<void> {
    try {
      const playerRef = doc(this.db, 'rooms', roomId, 'players', userId);
      await updateDoc(playerRef, { isReady: true });

      console.log('✅ Player marcado como pronto');
    } catch (error) {
      console.error('❌ Erro ao marcar como pronto:', error);
      throw error;
    }
  }
}