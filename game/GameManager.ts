/**
 * GameManager - Core Engine para Gerenciamento de Jogo de Turnos
 */

import { FirestoreManager } from './FirestoreManager';
import {
  GameEvent,
  GameEventType,
  GameState,
  Item,
  ItemCategory,
  ItemPoolConfig,
  ItemRarity,
  Player,
  PlayerHand,
  RoomConfig,
  RoomType,
  ValidationResult,
} from './types';

export class GameManager {
  private gameState: GameState;
  private eventListeners: Map<GameEventType, Function[]>;
  private itemPoolConfig: ItemPoolConfig;
  private roomId: string;
  private roomType: RoomType;
  private currentTurnId: string | null = null;

  constructor(
    roomId: string,
    hostId: string,
    roomType: RoomType,
    maxPlayers: number = 12
  ) {
    this.roomId = roomId;
    this.roomType = roomType;
    this.eventListeners = new Map();
    this.itemPoolConfig = this.calculateItemPoolConfig(maxPlayers);

    this.gameState = {
      roomId,
      roomConfig: {
        roomId,
        roomType,
        hostId,
        maxPlayers,
        currentPlayers: 0,
        status: 'lobby',
        createdAt: new Date(),
      },
      players: new Map(),
      playerHands: new Map(),
      itemPool: [],
      currentTurn: null as any,
      turns: [],
      round: 0,
      gameHistory: [],
      status: 'waiting',
      rankings: [],
    };

    this.initializeItemPool();
  }

  private calculateItemPoolConfig(maxPlayers: number): ItemPoolConfig {
    const itemsPerPlayer = 10;
    const discardBuffer = Math.ceil(maxPlayers * 2);
    const totalItems = maxPlayers * itemsPerPlayer + discardBuffer;

    const categories: ItemCategory[] = ['espadas', 'ouro', 'copas', 'paus'];
    const itemsPerCategory = Math.ceil(totalItems / categories.length);

    return {
      maxPlayers,
      totalItems,
      categoriesDistribution: {
        espadas: itemsPerCategory,
        ouro: itemsPerCategory,
        copas: itemsPerCategory,
        paus: itemsPerCategory,
      },
      rarityDistribution: {
        comum: Math.ceil(totalItems * 0.5),
        raro: Math.ceil(totalItems * 0.3),
        épico: Math.ceil(totalItems * 0.15),
        lendário: Math.ceil(totalItems * 0.05),
      },
    };
  }

  private initializeItemPool(): Item[] {
    const items: Item[] = [];
    let itemId = 0;

    const categories: ItemCategory[] = ['espadas', 'ouro', 'copas', 'paus'];
    const rarities: ItemRarity[] = ['comum', 'raro', 'épico', 'lendário'];

    categories.forEach((category) => {
      const itemsInCategory = this.itemPoolConfig.categoriesDistribution[category];

      for (let i = 0; i < itemsInCategory; i++) {
        const value = (i % 12) + 1;
        const rarity = rarities[Math.floor((itemId * 2.7) % rarities.length)];

        items.push({
          id: `item_${itemId}`,
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} ${value}`,
          category,
          value,
          rarity,
          isTrump: false,
        });

        itemId++;
      }
    });

    this.gameState.itemPool = this.shuffleArray(items);
    return this.gameState.itemPool;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor((i * 9301 + 49297) % 233280) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  private serializeItem(item: Item) {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      value: item.value,
      rarity: item.rarity,
      isTrump: Boolean(item.isTrump),
    };
  }

  private serializePlayer(player: Player) {
    return {
      id: player.id,
      name: player.name || 'Jogador',
      email: player.email || '',
      phone: player.phone || '',
      profileImage: player.profileImage || null,
      joinedAt: player.joinedAt || new Date(),
      isActive: Boolean(player.isActive),
      isMidGameJoin: Boolean((player as any).isMidGameJoin),
    };
  }

  private serializeTurn(turn: any) {
    const playedCards: Record<string, any> = {};

    if (turn?.playedCards instanceof Map) {
      turn.playedCards.forEach((card: Item, playerId: string) => {
        playedCards[playerId] = this.serializeItem(card);
      });
    }

    const data: any = {
      roundNumber: turn.roundNumber,
      turnNumber: turn.turnNumber,
      leaderId: turn.leaderId,
      playedCards,
      timestamp: turn.timestamp || new Date(),
    };

    if (turn.trumpCategory) {
      data.trumpCategory = turn.trumpCategory;
    }

    if (turn.winnerPlayerId) {
      data.winnerPlayerId = turn.winnerPlayerId;
    }

    return data;
  }

  private getSerializableGameState() {
    return {
      roomId: this.gameState.roomId,
      roomConfig: {
        roomId: this.gameState.roomConfig.roomId,
        roomType: this.gameState.roomConfig.roomType,
        hostId: this.gameState.roomConfig.hostId,
        maxPlayers: this.gameState.roomConfig.maxPlayers,
        currentPlayers: this.gameState.roomConfig.currentPlayers,
        status: this.gameState.roomConfig.status,
        createdAt: this.gameState.roomConfig.createdAt || new Date(),
        ...(this.gameState.roomConfig.startedAt
          ? { startedAt: this.gameState.roomConfig.startedAt }
          : {}),
        ...(this.gameState.roomConfig.endedAt
          ? { endedAt: this.gameState.roomConfig.endedAt }
          : {}),
      },
      players: Array.from(this.gameState.players.values()).map((player) =>
        this.serializePlayer(player)
      ),
      playerHands: Array.from(this.gameState.playerHands.entries()).map(
        ([playerId, hand]) => ({
          playerId,
          items: hand.items.map((item) => this.serializeItem(item)),
          isLeader: Boolean(hand.isLeader),
          score: hand.score || 0,
        })
      ),
      itemPool: this.gameState.itemPool.map((item) => this.serializeItem(item)),
      currentTurn: this.gameState.currentTurn
        ? this.serializeTurn(this.gameState.currentTurn)
        : null,
      turns: this.gameState.turns.map((turn) => this.serializeTurn(turn)),
      round: this.gameState.round,
      gameHistory: this.gameState.gameHistory || [],
      status: this.gameState.status,
      rankings: this.gameState.rankings || [],
    };
  }

  distributeInitialCards(): void {
    const itemsPerPlayer = 10;

    Array.from(this.gameState.players.keys()).forEach((playerId) => {
      const playerItems = this.gameState.itemPool.splice(0, itemsPerPlayer);

      this.gameState.playerHands.set(playerId, {
        playerId,
        items: playerItems,
        isLeader: false,
        score: 0,
      });
    });

    this.emit('card_distributed', {
      totalPlayers: this.gameState.players.size,
      itemsPerPlayer,
      itemsRemainingInPool: this.gameState.itemPool.length,
    });
  }

  joinMidGame(player: Player): void {
    if (
      this.gameState.roomConfig.currentPlayers >= this.gameState.roomConfig.maxPlayers
    ) {
      throw new Error('Sala cheia. Não é possível entrar.');
    }

    if (
      this.gameState.players.get(player.id) &&
      this.gameState.players.get(player.id)!.isActive
    ) {
      throw new Error('Jogador já está na sala.');
    }

    this.gameState.players.set(player.id, {
      ...player,
      joinedAt: new Date(),
      isActive: true,
      isMidGameJoin: true,
    });

    const itemsPerPlayer = 5;
    const playerItems = this.gameState.itemPool.splice(
      0,
      Math.min(itemsPerPlayer, this.gameState.itemPool.length)
    );

    this.gameState.playerHands.set(player.id, {
      playerId: player.id,
      items: playerItems,
      isLeader: false,
      score: 0,
    });

    this.gameState.roomConfig.currentPlayers++;

    this.emit('mid_game_join', {
      playerId: player.id,
      playerName: player.name,
      itemsReceived: playerItems.length,
      itemsRemainingInPool: this.gameState.itemPool.length,
    });
  }

  validateCardPlay(playerId: string, cardId: string): ValidationResult {
    const hand = this.gameState.playerHands.get(playerId);

    if (!hand) {
      return { isValid: false, reason: 'Jogador não encontrado' };
    }

    const card = hand.items.find((item) => item.id === cardId);

    if (!card) {
      return {
        isValid: false,
        reason: 'Card não está na mão do jogador',
      };
    }

    if (this.gameState.currentTurn.leaderId === playerId) {
      return {
        isValid: true,
        canPlayTrump: false,
        mustFollowCategory: false,
      };
    }

    const trumpCategory = this.gameState.currentTurn.trumpCategory;

    const hasCardOfCategory = hand.items.some(
      (item) => item.category === trumpCategory
    );

    if (hasCardOfCategory && card.category !== trumpCategory) {
      return {
        isValid: false,
        reason: `Você tem cards de ${trumpCategory}. Deve jogar dessa categoria.`,
        mustFollowCategory: true,
      };
    }

    if (!hasCardOfCategory && card.isTrump === false) {
      const hasTrump = hand.items.some((item) => item.isTrump);

      if (hasTrump) {
        return {
          isValid: false,
          reason: 'Você tem trunfos. Deve jogar um trunfo ou da categoria.',
          canPlayTrump: true,
        };
      }
    }

    return { isValid: true };
  }

  playCard(playerId: string, cardId: string): void {
    const validation = this.validateCardPlay(playerId, cardId);

    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    const hand = this.gameState.playerHands.get(playerId);
    const cardIndex = hand!.items.findIndex((item) => item.id === cardId);
    const card = hand!.items.splice(cardIndex, 1)[0];

    if (
      this.gameState.currentTurn.leaderId === playerId &&
      this.gameState.currentTurn.playedCards.size === 0
    ) {
      this.gameState.currentTurn.trumpCategory = card.category;
    }

    this.gameState.currentTurn.playedCards.set(playerId, card);

    if (this.currentTurnId) {
      FirestoreManager.playCard(this.roomId, this.currentTurnId, playerId, card).catch(
        (error) => {
          console.error('Erro ao registrar jogada no Firestore:', error);
        }
      );
    }

    this.emit('card_played', {
      playerId,
      cardName: card.name,
      category: card.category,
      value: card.value,
    });
  }

  startTurn(leaderId: string, trumpCategory?: ItemCategory): void {
    this.gameState.currentTurn = {
      roundNumber: this.gameState.round,
      turnNumber: this.gameState.turns.length + 1,
      leaderId,
      trumpCategory,
      playedCards: new Map(),
      timestamp: new Date(),
    };

    this.currentTurnId = `turn_${this.gameState.round}_${Date.now()}`;

    FirestoreManager.createTurn(this.roomId, this.gameState.currentTurn).catch(
      (error) => {
        console.error('Erro ao criar turno no Firestore:', error);
      }
    );

    this.emit('turn_started', {
      leaderId,
      roundNumber: this.gameState.round,
    });
  }

  endTurn(): string {
    let winnerPlayerId = this.gameState.currentTurn.leaderId;
    let winningCard = this.gameState.currentTurn.playedCards.get(winnerPlayerId);

    if (!winningCard) {
      throw new Error('Nenhum card foi jogado');
    }

    this.gameState.currentTurn.playedCards.forEach((card, playerId) => {
      if (playerId === this.gameState.currentTurn.leaderId) return;

      if (!winningCard) return;

      if (card.isTrump && !winningCard.isTrump) {
        winnerPlayerId = playerId;
        winningCard = card;
      } else if (
        card.category === winningCard.category &&
        card.value > winningCard.value
      ) {
        winnerPlayerId = playerId;
        winningCard = card;
      }
    });

    const winnerHand = this.gameState.playerHands.get(winnerPlayerId);

    if (winnerHand) {
      winnerHand.score += this.calculateRoundScore(
        this.gameState.currentTurn.playedCards
      );
    }

    this.gameState.currentTurn.winnerPlayerId = winnerPlayerId;
    this.gameState.turns.push(this.gameState.currentTurn);

    const scores = new Map<string, number>();

    this.gameState.playerHands.forEach((hand, playerId) => {
      scores.set(playerId, hand.score);
    });

    if (this.currentTurnId) {
      FirestoreManager.endTurn(
        this.roomId,
        this.currentTurnId,
        winnerPlayerId,
        scores
      ).catch((error) => {
        console.error('Erro ao finalizar turno no Firestore:', error);
      });
    }

    this.emit('turn_ended', {
      winnerId: winnerPlayerId,
      winningCard: winningCard.name,
      newScore: winnerHand?.score,
    });

    return winnerPlayerId;
  }

  private calculateRoundScore(playedCards: Map<string, Item>): number {
    let score = 0;

    playedCards.forEach((card) => {
      score += card.value;
    });

    return score;
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getSerializableState(): any {
    return this.getSerializableGameState();
  }

  getPlayerHand(playerId: string): PlayerHand | undefined {
    return this.gameState.playerHands.get(playerId);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.gameState.players.get(playerId);
  }

  getRoomConfig(): RoomConfig {
    return this.gameState.roomConfig;
  }

  addPlayer(player: Player): void {
    if (this.gameState.players.has(player.id)) {
      return;
    }

    if (this.gameState.players.size >= this.gameState.roomConfig.maxPlayers) {
      throw new Error('Sala cheia.');
    }

    this.gameState.players.set(player.id, {
      ...player,
      joinedAt: new Date(),
      isActive: true,
    });

    this.gameState.roomConfig.currentPlayers++;

    this.emit('player_joined', {
      playerId: player.id,
      playerName: player.name,
      totalPlayers: this.gameState.players.size,
    });
  }

  removePlayer(playerId: string): void {
    const player = this.gameState.players.get(playerId);

    if (player) {
      player.isActive = false;
      this.gameState.roomConfig.currentPlayers--;

      this.emit('player_left', {
        playerId,
        playerName: player.name,
        remainingPlayers: this.gameState.roomConfig.currentPlayers,
      });
    }
  }

  startGame(): void {
    if (this.gameState.players.size < 2) {
      throw new Error('É necessário no mínimo 2 jogadores para começar.');
    }

    this.gameState.status = 'active';
    this.gameState.roomConfig.status = 'playing';
    this.gameState.roomConfig.startedAt = new Date();
    this.gameState.round = 1;

    this.distributeInitialCards();

    const firstPlayerId = Array.from(this.gameState.players.keys())[0];
    this.startTurn(firstPlayerId);

    FirestoreManager.startGame(this.roomId, this.getSerializableGameState() as any).catch(
      (error) => {
        console.error('Erro ao iniciar jogo no Firestore:', error);
      }
    );

    this.emit('game_finished', {
      status: 'started',
      totalPlayers: this.gameState.players.size,
    });
  }

  finishGame(): void {
    this.gameState.status = 'finished';
    this.gameState.roomConfig.status = 'finished';
    this.gameState.roomConfig.endedAt = new Date();

    const rankings = Array.from(this.gameState.playerHands.values())
      .sort((a, b) => b.score - a.score)
      .map((hand, index) => ({
        playerId: hand.playerId,
        finalScore: hand.score,
        position: index + 1,
      }));

    this.gameState.rankings = rankings;

    this.emit('game_finished', {
      status: 'ended',
      rankings,
    });
  }

  on(eventType: GameEventType, handler: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    this.eventListeners.get(eventType)!.push(handler);
  }

  private emit(eventType: GameEventType, data: any): void {
    const handlers = this.eventListeners.get(eventType) || [];

    handlers.forEach((handler) => {
      try {
        handler({
          type: eventType,
          timestamp: new Date(),
          data,
        } as GameEvent);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    });
  }
}