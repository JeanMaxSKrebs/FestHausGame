/**
 * GameManager - Core Engine para Gerenciamento de Jogo de Turnos
 * Repsonsabilidades:
 * - Gerenciamento do Pool Dinâmico de Itens
 * - Distribuição Inicial
 * - Hot-Join Mid-Game
 * - Validação de Turnos
 * - Gerenciamento de Estado Global
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
    ValidationResult
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
    maxPlayers: number = 6
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

  /**
   * ============= POOL MANAGEMENT =============
   */

  /**
   * Calcula a configuração do pool baseado no número máximo de jogadores
   * Fórmula: Cada jogador recebe ~10 itens + buffer para descartes
   */
  private calculateItemPoolConfig(maxPlayers: number): ItemPoolConfig {
    const itemsPerPlayer = 10;
    const discardBuffer = Math.ceil(maxPlayers * 2); // Buffer para descartes
    const totalItems = maxPlayers * itemsPerPlayer + discardBuffer;

    const categories: ItemCategory[] = ['espadas', 'ouro', 'copas', 'paus'];
    const itemsPerCategory = Math.ceil(totalItems / categories.length);

    const categoryDistribution: Record<ItemCategory, number> = {
      espadas: itemsPerCategory,
      ouro: itemsPerCategory,
      copas: itemsPerCategory,
      paus: itemsPerCategory,
    };

    const rarityDistribution: Record<ItemRarity, number> = {
      comum: Math.ceil(totalItems * 0.5),
      raro: Math.ceil(totalItems * 0.3),
      épico: Math.ceil(totalItems * 0.15),
      lendário: Math.ceil(totalItems * 0.05),
    };

    return {
      maxPlayers,
      totalItems,
      categoriesDistribution: categoryDistribution,
      rarityDistribution,
    };
  }

  /**
   * Inicializa o pool completo de itens baseado na configuração
   * Garante distribuição uniforme entre categorias
   */
  private initializeItemPool(): Item[] {
    const items: Item[] = [];
    let itemId = 0;

    const categories: ItemCategory[] = ['espadas', 'ouro', 'copas', 'paus'];
    const rarities: ItemRarity[] = ['comum', 'raro', 'épico', 'lendário'];

    categories.forEach((category) => {
      const itemsInCategory =
        this.itemPoolConfig.categoriesDistribution[category];

      for (let i = 0; i < itemsInCategory; i++) {
        const value = (i % 12) + 1; // Valores de 1-12
        const rarity =
          rarities[Math.floor((itemId * 2.7) % rarities.length)]; // Distribuição pseudo-aleatória

        items.push({
          id: `item_${itemId}`,
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} ${value}`,
          category,
          value,
          rarity: rarity as ItemRarity,
          isTrump: false,
        });

        itemId++;
      }
    });

    // Embaralhar o pool
    this.gameState.itemPool = this.shuffleArray(items);
    return this.gameState.itemPool;
  }

  /**
   * Embaralha um array (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Distribui itens iniciais para todos os jogadores
   */
  distributeInitialCards(): void {
    const itemsPerPlayer = 10;

    Array.from(this.gameState.players.keys()).forEach((playerId) => {
      const playerItems = this.gameState.itemPool.splice(
        0,
        itemsPerPlayer
      );

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

  /**
   * ============= HOT-JOIN MID-GAME =============
   */

  /**
   * Permite que um jogador entre no meio do jogo
   * Recebe itens do pool restante
   */
  joinMidGame(player: Player): void {
    // Validação
    if (this.gameState.roomConfig.currentPlayers >=
      this.gameState.roomConfig.maxPlayers) {
      throw new Error('Sala cheia. Não é possível entrar.');
    }

    if (
      this.gameState.players.get(player.id) &&
      this.gameState.players.get(player.id)!.isActive
    ) {
      throw new Error('Jogador já está na sala.');
    }

    // Adicionar jogador
    this.gameState.players.set(player.id, {
      ...player,
      joinedAt: new Date(),
      isActive: true,
      isMidGameJoin: true,
    });

    // Distribuir itens do que restou no pool
    const itemsPerPlayer = 5; // Menos itens para quem entra no meio
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

  /**
   * ============= TURN VALIDATION =============
   */

  /**
   * Valida se um card pode ser jogado neste turno
   * Regras:
   * 1. Se há cards da categoria puxada, DEVE jogar dessa categoria
   * 2. Se não há, pode jogar um trunfo
   * 3. Se não há trunfo, pode descartar
   */
  validateCardPlay(
    playerId: string,
    cardId: string
  ): ValidationResult {
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

    // Se é o líder do turno, pode jogar qualquer coisa e define a categoria
    if (this.gameState.currentTurn.leaderId === playerId) {
      return {
        isValid: true,
        canPlayTrump: false,
        mustFollowCategory: false,
      };
    }

    // Se não é o líder
    const trumpCategory = this.gameState.currentTurn.trumpCategory;

    // Verifica se tem cards da categoria puxada
    const hasCardOfCategory = hand.items.some(
      (item) => item.category === trumpCategory
    );

    // Se tem card da categoria, DEVE jogar essa categoria
    if (hasCardOfCategory && card.category !== trumpCategory) {
      return {
        isValid: false,
        reason: `Você tem cards de ${trumpCategory}. Deve jogar dessa categoria.`,
        mustFollowCategory: true,
      };
    }

    // Se não tem da categoria, verifica trunfo
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

  /**
   * Processa o card jogado
   */
  playCard(playerId: string, cardId: string): void {
    const validation = this.validateCardPlay(playerId, cardId);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    const hand = this.gameState.playerHands.get(playerId);
    const cardIndex = hand!.items.findIndex((item) => item.id === cardId);
    const card = hand!.items.splice(cardIndex, 1)[0];

    // Se é o líder e primeira carta, define a categoria
    if (this.gameState.currentTurn.leaderId === playerId &&
      this.gameState.currentTurn.playedCards.size === 0) {
      this.gameState.currentTurn.trumpCategory = card.category;
    }

    this.gameState.currentTurn.playedCards.set(playerId, card);

    // Sincronizar com Firestore
    if (this.currentTurnId) {
      FirestoreManager.playCard(
        this.roomId,
        this.currentTurnId,
        playerId,
        card
      ).catch(error => {
        console.error('Erro ao registrar jogada no Firestore:', error);
      });
    }

    this.emit('card_played', {
      playerId,
      cardName: card.name,
      category: card.category,
      value: card.value,
    });
  }

  /**
   * ============= TURN MANAGEMENT =============
   */

  /**
   * Inicia um novo turno
   */
  startTurn(leaderId: string, trumpCategory?: ItemCategory): void {
    this.gameState.currentTurn = {
      roundNumber: this.gameState.round,
      turnNumber: this.gameState.turns.length + 1,
      leaderId,
      trumpCategory,
      playedCards: new Map(),
      timestamp: new Date(),
    };

    // Sincronizar com Firestore
    this.currentTurnId = `turn_${this.gameState.round}_${Date.now()}`;
    FirestoreManager.createTurn(this.roomId, this.gameState.currentTurn).catch(error => {
      console.error('Erro ao criar turno no Firestore:', error);
    });

    this.emit('turn_started', {
      leaderId,
      roundNumber: this.gameState.round,
    });
  }

  /**
   * Encerra o turno e determina o vencedor
   */
  endTurn(): string {
    let winnerPlayerId = this.gameState.currentTurn.leaderId;
    let winningCard = this.gameState.currentTurn.playedCards.get(winnerPlayerId);

    if (!winningCard) {
      throw new Error('Nenhum card foi jogado');
    }

    // Compara todos os cards para encontrar o vencedor
    this.gameState.currentTurn.playedCards.forEach((card, playerId) => {
      if (playerId === this.gameState.currentTurn.leaderId) return;

      if (!winningCard) return; // Double check for TypeScript

      // Trunfo vence tudo
      if (card.isTrump && !winningCard.isTrump) {
        winnerPlayerId = playerId;
        winningCard = card;
      }
      // Mesma categoria: maior valor vence
      else if (
        card.category === winningCard.category &&
        card.value > winningCard.value
      ) {
        winnerPlayerId = playerId;
        winningCard = card;
      }
    });

    // Atualizar score
    const winnerHand = this.gameState.playerHands.get(winnerPlayerId);
    if (winnerHand) {
      winnerHand.score += this.calculateRoundScore(
        this.gameState.currentTurn.playedCards
      );
    }

    this.gameState.currentTurn.winnerPlayerId = winnerPlayerId;
    this.gameState.turns.push(this.gameState.currentTurn);

    // Sincronizar com Firestore
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
      ).catch(error => {
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

  /**
   * Calcula o score de uma rodada baseado nos values dos cards
   */
  private calculateRoundScore(playedCards: Map<string, Item>): number {
    let score = 0;
    playedCards.forEach((card) => {
      score += card.value;
    });
    return score;
  }

  /**
   * ============= STATE GETTERS =============
   */

  getGameState(): GameState {
    return this.gameState;
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

  /**
   * ============= PLAYER MANAGEMENT =============
   */

  addPlayer(player: Player): void {
    if (this.gameState.players.size >= this.gameState.roomConfig.maxPlayers) {
      throw new Error('Sala cheia.');
    }

    this.gameState.players.set(player.id, {
      ...player,
      joinedAt: new Date(),
      isActive: true,
    });

    this.gameState.roomConfig.currentPlayers++;

    // Sincronizar com Firestore
    if (this.gameState.status === 'waiting') {
      // Sala ainda no lobby
      FirestoreManager.joinRoom(this.roomId, player).catch(error => {
        console.error('Erro ao sincronizar player no Firestore:', error);
      });
    }

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

  /**
   * ============= GAME LIFECYCLE =============
   */

  startGame(): void {
    if (this.gameState.players.size < 2) {
      throw new Error('É necessário no mínimo 2 jogadores para começar.');
    }

    this.gameState.status = 'active';
    this.gameState.roomConfig.status = 'playing';
    this.gameState.roomConfig.startedAt = new Date();
    this.gameState.round = 1;

    this.distributeInitialCards();

    // Sincronizar com Firestore
    FirestoreManager.startGame(this.roomId, this.gameState).catch(error => {
      console.error('Erro ao iniciar jogo no Firestore:', error);
    });

    // Define o primeiro líder (primeira pessoa a se juntar)
    const firstPlayerId = Array.from(this.gameState.players.keys())[0];
    this.startTurn(firstPlayerId);

    this.emit('game_finished', {
      status: 'started',
      totalPlayers: this.gameState.players.size,
    });
  }

  finishGame(): void {
    this.gameState.status = 'finished';
    this.gameState.roomConfig.status = 'finished';
    this.gameState.roomConfig.endedAt = new Date();

    // Calcular rankings finais
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

  /**
   * ============= EVENT SYSTEM =============
   */

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
