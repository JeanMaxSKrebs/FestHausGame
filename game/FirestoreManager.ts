/**
 * Firestore Manager - Sincronização em Tempo Real
 * Gerencia persistência e sync de estado de jogo via Firestore
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    onSnapshot,
    setDoc,
    Timestamp,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import { GameState, Item, Player, RoomConfig, Turn } from './types';

export interface FirestoreRoomData {
  roomId: string;
  roomType: 'waiting_room' | 'direct_invite';
  createdBy: string;
  createdAt: any;
  status: 'looking_for_players' | 'in_progress' | 'finished';
  maxPlayers: number;
  players: string[]; // Array de UserIds
  gameState?: GameState;
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

  /**
   * Cria uma nova sala no Firestore
   */
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
        maxPlayers: config.maxPlayers || 6,
        players: [userId],
      };

      await setDoc(doc(this.db, 'rooms', roomId), roomData);
      console.log('✅ Room criada no Firestore:', roomId);
    } catch (error) {
      console.error('❌ Erro ao criar room:', error);
      throw error;
    }
  }

  /**
   * Jogador entra em uma sala existente
   */
  static async joinRoom(roomId: string, player: Player): Promise<void> {
    try {
      const roomRef = doc(this.db, 'rooms', roomId);

      // Atualizar lista de players
      await updateDoc(roomRef, {
        players: `rooms.${roomId}.players.append(['${player.id}'])`,
      });

      // Criar documento do player
      const playerRef = doc(
        this.db,
        'rooms',
        roomId,
        'players',
        player.id
      );
      const playerData: FirestorePlayerData = {
        userId: player.id,
        name: player.name,
        email: player.email || '',
        phone: player.phone,
        joinedAt: Timestamp.now(),
        score: 0,
        isReady: false,
      };

      await setDoc(playerRef, playerData);
      console.log('✅ Player entrou na sala:', player.name);
    } catch (error) {
      console.error('❌ Erro ao entrar na sala:', error);
      throw error;
    }
  }

  /**
   * Iniciar jogo - guardar estado inicial no Firestore
   */
  static async startGame(roomId: string, gameState: GameState): Promise<void> {
    try {
      const roomRef = doc(this.db, 'rooms', roomId);

      await updateDoc(roomRef, {
        status: 'in_progress',
        gameState: gameState, // Salvar estado completo
      });

      // Criar primeiro turno
      await this.createTurn(roomId, gameState.currentTurn);

      console.log('✅ Jogo iniciado no Firestore');
    } catch (error) {
      console.error('❌ Erro ao iniciar jogo:', error);
      throw error;
    }
  }

  /**
   * Criar novo turno
   */
  static async createTurn(roomId: string, turn: Turn): Promise<void> {
    try {
      const turnId = `turn_${turn.roundNumber}_${Date.now()}`;
      const turnRef = doc(this.db, 'rooms', roomId, 'turns', turnId);

      const turnData: FirestoreTurnData = {
        leaderId: turn.leaderId,
        round: turn.roundNumber,
        trumpCategory: turn.trumpCategory,
        playedCards: {},
        timestamp: Timestamp.now(),
      };

      await setDoc(turnRef, turnData);
      console.log('✅ Turno criado:', turnId);
    } catch (error) {
      console.error('❌ Erro ao criar turno:', error);
      throw error;
    }
  }

  /**
   * Registrar carta jogada pelo jogador
   */
  static async playCard(
    roomId: string,
    turnId: string,
    playerId: string,
    card: Item
  ): Promise<void> {
    try {
      const turnRef = doc(this.db, 'rooms', roomId, 'turns', turnId);

      await updateDoc(turnRef, {
        [`playedCards.${playerId}`]: {
          id: card.id,
          name: card.name,
          category: card.category,
          value: card.value,
          rarity: card.rarity,
          isTrump: card.isTrump,
        },
      });

      console.log('✅ Carta registrada:', card.name);
    } catch (error) {
      console.error('❌ Erro ao registrar carta:', error);
      throw error;
    }
  }

  /**
   * Finalizar turno e calcular vencedor
   */
  static async endTurn(
    roomId: string,
    turnId: string,
    winnerId: string,
    scores: Map<string, number>
  ): Promise<void> {
    try {
      const turnRef = doc(this.db, 'rooms', roomId, 'turns', turnId);
      const batch = writeBatch(this.db);

      // Atualizar turno com vencedor
      batch.update(turnRef, {
        winnerId: winnerId,
      });

      // Atualizar scoreboards dos players
      for (const [playerId, score] of scores) {
        const playerRef = doc(this.db, 'rooms', roomId, 'players', playerId);
        batch.update(playerRef, {
          score: score,
        });
      }

      await batch.commit();
      console.log('✅ Turno finalizado:', winnerId, 'venceu');
    } catch (error) {
      console.error('❌ Erro ao finalizar turno:', error);
      throw error;
    }
  }

  /**
   * Finalizar jogo
   */
  static async finishGame(
    roomId: string,
    rankings: Player[]
  ): Promise<void> {
    try {
      const roomRef = doc(this.db, 'rooms', roomId);

      await updateDoc(roomRef, {
        status: 'finished',
        'gameState.rankings': rankings,
        'gameState.isGameFinished': true,
      });

      console.log('✅ Jogo finalizado');
    } catch (error) {
      console.error('❌ Erro ao finalizar jogo:', error);
      throw error;
    }
  }

  /**
   * Listener em tempo real para a sala
   * Retorna unsubscribe function
   */
  static listenToRoom(
    roomId: string,
    callback: (roomData: FirestoreRoomData) => void,
    onError?: (error: any) => void
  ): () => void {
    try {
      const roomRef = doc(this.db, 'rooms', roomId);

      const unsubscribe = onSnapshot(roomRef, (doc: any) => {
        if (doc.exists()) {
          const data = doc.data() as FirestoreRoomData;
          callback(data);
        }
      }, (error: any) => {
        console.error('❌ Erro ao escutar sala:', error);
        onError?.(error);
      });

      console.log('👂 Escutando mudanças na sala:', roomId);
      return unsubscribe;
    } catch (error) {
      console.error('❌ Erro ao configurar listener de sala:', error);
      throw error;
    }
  }

  /**
   * Listener para turno atual
   */
  static listenToTurn(
    roomId: string,
    turnId: string,
    callback: (turnData: FirestoreTurnData) => void,
    onError?: (error: any) => void
  ): () => void {
    try {
      const turnRef = doc(this.db, 'rooms', roomId, 'turns', turnId);

      const unsubscribe = onSnapshot(turnRef, (doc: any) => {
        if (doc.exists()) {
          const data = doc.data() as FirestoreTurnData;
          callback(data);
        }
      }, (error: any) => {
        console.error('❌ Erro ao escutar turno:', error);
        onError?.(error);
      });

      console.log('👂 Escutando mudanças no turno:', turnId);
      return unsubscribe;
    } catch (error) {
      console.error('❌ Erro ao configurar listener de turno:', error);
      throw error;
    }
  }

  /**
   * Listener para players na sala
   */
  static listenToPlayers(
    roomId: string,
    callback: (players: FirestorePlayerData[]) => void,
    onError?: (error: any) => void
  ): () => void {
    try {
      const playersRef = collection(this.db, 'rooms', roomId, 'players');

      const unsubscribe = onSnapshot(playersRef, (snapshot: any) => {
        const players: FirestorePlayerData[] = [];
        snapshot.forEach((doc: any) => {
          players.push(doc.data() as FirestorePlayerData);
        });
        callback(players);
      }, (error: any) => {
        console.error('❌ Erro ao escutar players:', error);
        onError?.(error);
      });

      console.log('👂 Escutando players da sala:', roomId);
      return unsubscribe;
    } catch (error) {
      console.error('❌ Erro ao configurar listener de players:', error);
      throw error;
    }
  }

  /**
   * Obter dados de uma sala (uma vez)
   */
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

  /**
   * Obter todos os jogadores de uma sala
   */
  static async getPlayers(roomId: string): Promise<FirestorePlayerData[]> {
    try {
      const playersRef = collection(this.db, 'rooms', roomId, 'players');
      const playersSnap = await getDocs(playersRef);

      const players: FirestorePlayerData[] = [];
      playersSnap.forEach((doc: any) => {
        players.push(doc.data() as FirestorePlayerData);
      });

      return players;
    } catch (error) {
      console.error('❌ Erro ao obter players:', error);
      return [];
    }
  }

  /**
   * Sair de uma sala
   */
  static async leaveRoom(roomId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(this.db);

      const roomRef = doc(this.db, 'rooms', roomId);
      const playerRef = doc(this.db, 'rooms', roomId, 'players', userId);

      // Remover player da lista
      const roomData = await this.getRoom(roomId);
      if (roomData) {
        const updatedPlayers = roomData.players.filter((id) => id !== userId);
        batch.update(roomRef, { players: updatedPlayers });
      }

      // Deletar documento do player
      batch.delete(playerRef);

      await batch.commit();
      console.log('✅ Player saiu da sala');
    } catch (error) {
      console.error('❌ Erro ao sair da sala:', error);
      throw error;
    }
  }

  /**
   * Validar se convite é válido
   */
  static async validateRoomInvite(roomId: string): Promise<boolean> {
    try {
      const room = await this.getRoom(roomId);

      if (!room) {
        console.warn('⚠️ Sala não encontrada');
        return false;
      }

      // Verificar se ainda está procurando jogadores
      if (room.status !== 'looking_for_players') {
        console.warn('⚠️ Sala já iniciou ou terminou');
        return false;
      }

      // Verificar se ainda tem slots disponíveis
      if (room.players.length >= room.maxPlayers) {
        console.warn('⚠️ Sala cheia');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao validar sala:', error);
      return false;
    }
  }

  /**
   * Atualizar score do player
   */
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

  /**
   * Marcar player como pronto
   */
  static async markPlayerReady(
    roomId: string,
    userId: string
  ): Promise<void> {
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
