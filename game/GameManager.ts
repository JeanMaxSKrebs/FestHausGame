/**
 * GameManager - Fest Haus Game
 * Baralho central + turno + cartas guardadas + modo bônus.
 */

import { FirestoreManager } from './FirestoreManager';
import {
  GameEvent,
  GameEventType,
  GameMode,
  GameState,
  Item,
  ItemCategory,
  ItemPoolConfig,
  Player,
  PlayerHand,
  RoomConfig,
  RoomType
} from './types';

export type GameManagerOptions = {
  deckMultiplier?: number;
  virtualPlayerCount?: number;
  secretVoteEnabled?: boolean;
};

export class GameManager {
  private gameState: GameState;
  private eventListeners: Map<GameEventType, Function[]>;
  private itemPoolConfig: ItemPoolConfig;
  private roomId: string;
  private roomType: RoomType;
  private isSoloMode: boolean = false;
  private deckMultiplier: number = 1;
  private virtualPlayerCount: number = 1;
  private secretVoteEnabled: boolean = false;

  constructor(
    roomId: string,
    hostId: string,
    roomType: RoomType,
    maxPlayers: number = 12,
    gameMode: GameMode = 'normal',
    isSoloMode: boolean = false,
    options: GameManagerOptions = {}

  ) {
    this.roomId = roomId;
    this.roomType = roomType;
    this.eventListeners = new Map();

    this.deckMultiplier = Math.min(Math.max(options.deckMultiplier || 1, 1), 6);
    this.virtualPlayerCount = Math.min(Math.max(options.virtualPlayerCount || 1, 1), 12);
    this.secretVoteEnabled = Boolean(options.secretVoteEnabled);

    this.itemPoolConfig = this.calculateItemPoolConfig(maxPlayers);

    this.gameState = {
      bathroomPasses: [],
      generalRules: [],
      roomId,
      roomConfig: {
        roomId,
        roomType,
        hostId,
        maxPlayers,
        currentPlayers: 0,
        status: 'lobby',
        createdAt: new Date(),
        gameMode,
        deckMultiplier: this.deckMultiplier,
        virtualPlayerCount: this.virtualPlayerCount,
        secretVoteEnabled: this.secretVoteEnabled,
      },
      players: new Map(),
      playerHands: new Map(),
      itemPool: [],
      discardPile: [],
      currentTurn: null as any,
      turns: [],
      round: 0,
      gameHistory: [],
      gameLog: [],
      status: 'waiting',
      rankings: [],
      kingCupCount: 0,
      tradeLockedPlayers: {},
    };
    this.isSoloMode = isSoloMode;
    this.initializeItemPool();
    
  }
  
  private calculateItemPoolConfig(maxPlayers: number, deckMultiplier: number = 1): ItemPoolConfig {
    const totalItems = 52 * deckMultiplier;

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
        coringa: 0,
      },
    };
  }

  private getCardRule(value: number) {
    switch (value) {
      case 1:
        return {
          title: 'Escolhe um',
          description: 'Você escolhe alguém para dar 1 gole.',
          actionType: 'drink' as const,
        };
      case 2:
        return {
          title: 'Escolhe dois',
          description: 'Você escolhe duas pessoas para beber ou uma pessoa para beber 2 vezes.',
          actionType: 'drink' as const,
        };
      case 3:
        return {
          title: 'Escolhe três',
          description: 'Você escolhe três pessoas ou distribui 3 goles.',
          actionType: 'drink' as const,
        };
      case 4:
        return {
          title: 'Dedo na Mesa',
          description:
            'Você coloca o dedo discretamente na mesa. O último que perceber bebe. No modo bônus, pode cancelar se perder ou dobrar a dose do perdedor.',
          actionType: 'table_finger' as const,
        };
      case 5:
        return {
          title: 'Cavalheiro',
          description: 'Todos os homens bebem.',
          actionType: 'drink' as const,
        };
      case 6:
        return {
          title: 'Damas',
          description: 'Todas as mulheres bebem.',
          actionType: 'drink' as const,
        };
      case 7:
        return {
          title: 'Pium',
          description:
            'Começa uma contagem. No 7, múltiplos de 7 ou números com 7, deve-se dizer Pium. Quem errar bebe.',
          actionType: 'mini_game' as const,
        };
      case 8:
        return {
          title: 'Regra Geral',
          description:
            'Você cria uma regra. Quem descumprir até o fim do jogo bebe.',
          actionType: 'rule' as const,
        };
      case 9:
        return {
          title: 'Stop',
          description:
            'Você escolhe um tema. Cada jogador fala um item. Quem travar ou repetir bebe.',
          actionType: 'mini_game' as const,
        };
      case 10:
        return {
          title: 'Banheiro',
          description:
            'Só você pode ir ao banheiro ou sair da mesa. Pode guardar ou negociar essa carta.',
          actionType: 'bathroom' as const,
        };
      case 11:
        return {
          title: 'O da Esquerda',
          description: 'Quem está à sua esquerda bebe.',
          actionType: 'drink' as const,
        };
      case 12:
        return {
          title: 'O da Direita',
          description: 'Quem está à sua direita bebe.',
          actionType: 'drink' as const,
        };
      case 13:
        return {
          title: 'Rei do Copo',
          description:
            'Os 3 primeiros reis colocam bebida no copo central. O 4º rei vira o copo.',
          actionType: 'king_cup' as const,
        };
      default:
        return {
          title: 'Carta',
          description: 'Cumpra a regra da carta.',
          actionType: 'drink' as const,
        };
    }
  }

  private getDisplayName(category: ItemCategory, value: number) {
    const label =
      value === 1 ? 'Ás' : value === 11 ? 'Valete' : value === 12 ? 'Dama' : value === 13 ? 'Rei' : String(value);

    return `${label} de ${category}`;
  }

  private initializeItemPool(): Item[] {
    const items: Item[] = [];
    const categories: ItemCategory[] = ['espadas', 'ouro', 'copas', 'paus'];

    let itemId = 0;

    for (let deckIndex = 0; deckIndex < this.deckMultiplier; deckIndex++) {
      categories.forEach((category) => {
        for (let value = 1; value <= 13; value++) {
          const rule = this.getCardRule(value);

          items.push({
            id: `deck_${deckIndex}_card_${category}_${value}_${itemId}`,
            name: this.getDisplayName(category, value),
            category,
            value,
            isTrump: false,
            ruleTitle: rule.title,
            ruleDescription: rule.description,
            actionType: rule.actionType,
          });

          itemId++;
        }
      });
    }

    this.gameState.itemPool = this.shuffleArray(items);
    return this.gameState.itemPool;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const random = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[random]] = [shuffled[random], shuffled[i]];
    }

    return shuffled;
  }

  private serializeItem(item: Item) {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      value: item.value,
      isTrump: Boolean(item.isTrump),
      ruleTitle: item.ruleTitle || '',
      ruleDescription: item.ruleDescription || '',
      actionType: item.actionType || 'drink',
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
    if (!turn) return null;

    return {
      roundNumber: turn.roundNumber,
      turnNumber: turn.turnNumber,
      leaderId: turn.leaderId,
      currentPlayerId: turn.currentPlayerId,
      drawnCard: turn.drawnCard ? this.serializeItem(turn.drawnCard) : null,
      keptCard: turn.keptCard ? this.serializeItem(turn.keptCard) : null,
      playedCard: turn.playedCard ? this.serializeItem(turn.playedCard) : null,
      actionTaken: turn.actionTaken || 'skipped',
      timestamp: turn.timestamp || new Date(),
    };
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
        startedAt: this.gameState.roomConfig.startedAt || null,
        endedAt: this.gameState.roomConfig.endedAt || null,
        gameMode: this.gameState.roomConfig.gameMode || 'normal',
        deckMultiplier: this.gameState.roomConfig.deckMultiplier || this.deckMultiplier,
        virtualPlayerCount: this.gameState.roomConfig.virtualPlayerCount || this.virtualPlayerCount,
        secretVoteEnabled: Boolean(this.gameState.roomConfig.secretVoteEnabled),
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
      discardPile: this.gameState.discardPile.map((item) => this.serializeItem(item)),
      currentTurn: this.serializeTurn(this.gameState.currentTurn),
      turns: this.gameState.turns.map((turn) => this.serializeTurn(turn)),
      round: this.gameState.round,
      gameHistory: this.gameState.gameHistory || [],
      gameLog: this.gameState.gameLog || [],
      generalRules: (this.gameState.generalRules || []).map((rule) => ({
        id: rule.id,
        text: rule.text,
        cardId: rule.cardId,
        playerId: rule.playerId,
        playerName: rule.playerName,
        createdAt: rule.createdAt || new Date(),
      })),
      bathroomPasses: (this.gameState.bathroomPasses || []).map((pass) => ({
        id: pass.id,
        name: pass.name,
        cardId: pass.cardId,
        playerId: pass.playerId,
        createdAt: pass.createdAt || new Date(),
      })),
      status: this.gameState.status,
      rankings: this.gameState.rankings || [],
      kingCupCount: this.gameState.kingCupCount || 0,
    };
  }


  private getPlayerOrder(): string[] {
    return Array.from(this.gameState.players.keys()).filter((playerId) => {
      const player = this.gameState.players.get(playerId);
      return player?.isActive;
    });
  }

  private getNextPlayerId(currentPlayerId: string): string {
    const players = this.getPlayerOrder();

    if (players.length === 0) {
      return currentPlayerId;
    }

    const currentIndex = players.indexOf(currentPlayerId);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % players.length;

    return players[nextIndex];
  }

  private addGameLog(playerId: string, action: string, description: string, card?: Item | null) {
    const player = this.gameState.players.get(playerId);

    this.gameState.gameLog.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      playerId,
      playerName: player?.name || 'Jogador',
      card: card || null,
      action,
      description,
      createdAt: new Date(),
    });

    this.gameState.gameLog = this.gameState.gameLog.slice(0, 30);
  }

  private ensurePlayerHand(playerId: string) {
    if (!this.gameState.playerHands.has(playerId)) {
      this.gameState.playerHands.set(playerId, {
        playerId,
        items: [],
        isLeader: false,
        score: 0,
      });
    }

    return this.gameState.playerHands.get(playerId)!;
  }

  configureSoloBeforeStart(mainPlayer: Player, playerCount: number, deckMultiplier: number): void {
    if (!this.isSoloMode) {
      throw new Error('Essa configuração é apenas para o modo solo.');
    }

    if (this.gameState.status !== 'waiting') {
      throw new Error('Só é possível alterar pessoas/cartas antes de iniciar o jogo.');
    }

    const safePlayerCount = Math.min(Math.max(playerCount, 1), 12);
    const safeDeckMultiplier = Math.min(Math.max(deckMultiplier, 1), 6);

    this.virtualPlayerCount = safePlayerCount;
    this.deckMultiplier = safeDeckMultiplier;

    this.gameState.roomConfig.maxPlayers = safePlayerCount;
    this.gameState.roomConfig.currentPlayers = safePlayerCount;
    this.gameState.roomConfig.virtualPlayerCount = safePlayerCount;
    this.gameState.roomConfig.deckMultiplier = safeDeckMultiplier;

    this.itemPoolConfig = this.calculateItemPoolConfig(safePlayerCount, safeDeckMultiplier);

    this.gameState.players.clear();
    this.gameState.playerHands.clear();

    const normalizedMainPlayer: Player = {
      ...mainPlayer,
      id: mainPlayer.id,
      name: mainPlayer.name || 'Jogador 1',
      joinedAt: new Date(),
      isActive: true,
    };

    this.gameState.players.set(normalizedMainPlayer.id, normalizedMainPlayer);
    this.ensurePlayerHand(normalizedMainPlayer.id);

    for (let index = 2; index <= safePlayerCount; index++) {
      const virtualPlayer: Player = {
        id: `solo_virtual_${index}`,
        name: `Jogador ${index}`,
        phone: '',
        email: '',
        joinedAt: new Date(),
        isActive: true,
      };

      this.gameState.players.set(virtualPlayer.id, virtualPlayer);
      this.ensurePlayerHand(virtualPlayer.id);
    }

    this.gameState.itemPool = [];
    this.gameState.discardPile = [];
    this.gameState.turns = [];
    this.gameState.gameHistory = [];
    this.gameState.gameLog = [];
    this.gameState.kingCupCount = 0;
    this.gameState.round = 0;
    this.gameState.currentTurn = null as any;

    this.initializeItemPool();
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

    this.ensurePlayerHand(player.id);
    this.gameState.roomConfig.currentPlayers++;

    this.emit('player_joined', {
      playerId: player.id,
      playerName: player.name,
      totalPlayers: this.gameState.players.size,
    });
  }
  private addJokersForPlayers(): void {
    const playerCount = this.gameState.players.size;

    for (let i = 0; i < playerCount; i++) {
      this.gameState.itemPool.push({
        id: `joker_${this.roomId}_${i}_${Date.now()}`,
        name: 'Coringa',
        category: 'coringa',
        value: 0,
        isTrump: false,
        ruleTitle: 'Coringa',
        ruleDescription:
          'Guarde esta carta. No fim da rodada, use para adicionar +1 dose ao jogador mais votado.',
        actionType: 'joker',
      });
    }

    this.gameState.itemPool = this.shuffleArray(this.gameState.itemPool);
  }

  startGame(): void {
    if (!this.isSoloMode && this.gameState.players.size < 2) {
      throw new Error('É necessário no mínimo 2 jogadores para começar.');
    }

    this.gameState.status = 'active';
    this.gameState.roomConfig.status = 'playing';
    this.gameState.roomConfig.startedAt = new Date();
    this.gameState.round = 1;
    if (!this.isSoloMode && this.gameState.roomConfig.gameMode === 'bonus') {
      this.addJokersForPlayers();
    }    
    Array.from(this.gameState.players.keys()).forEach((playerId) => {
      this.ensurePlayerHand(playerId);
    });

    const firstPlayerId = Array.from(this.gameState.players.keys())[0];
    this.startTurn(firstPlayerId);

    if (!this.isSoloMode) {
      FirestoreManager.startGame(this.roomId, this.getSerializableGameState() as any).catch(
        (error) => {
          console.error('Erro ao iniciar jogo no Firestore:', error);
        }
      );
    }

    this.emit('game_finished', {
      status: 'started',
      totalPlayers: this.gameState.players.size,
    });
  }

  startTurn(playerId: string): void {
    this.gameState.currentTurn = {
      roundNumber: this.gameState.round,
      turnNumber: this.gameState.turns.length + 1,
      leaderId: playerId,
      currentPlayerId: playerId,
      drawnCard: null,
      keptCard: null,
      playedCard: null,
      actionTaken: 'skipped',
      timestamp: new Date(),
    };

    this.emit('turn_started', {
      playerId,
      roundNumber: this.gameState.round,
      turnNumber: this.gameState.currentTurn.turnNumber,
    });
  }

  drawCard(playerId: string): Item {
    if (this.gameState.status !== 'active') {
      throw new Error('O jogo ainda não está ativo.');
    }

    if (this.gameState.currentTurn.currentPlayerId !== playerId) {
      throw new Error('Ainda não é sua vez.');
    }

    if (this.gameState.currentTurn.drawnCard) {
      throw new Error('Você já comprou uma carta neste turno.');
    }

    const card = this.gameState.itemPool.shift();

    if (!card) {
      this.finishGame();
      throw new Error('O baralho acabou. O jogo foi finalizado.');
    }

    this.gameState.currentTurn.drawnCard = card;
    this.gameState.currentTurn.actionTaken = 'drawn';

    this.syncStateToFirestore();

    this.emit('card_drawn', {
      playerId,
      card,
      cardsLeft: this.gameState.itemPool.length,
    });

    return card;
  }

  keepDrawnCard(playerId: string): void {
    const turn = this.gameState.currentTurn;

    if (turn.currentPlayerId !== playerId) {
      throw new Error('Ainda não é sua vez.');
    }

    if (!turn.drawnCard) {
      throw new Error('Compre uma carta primeiro.');
    }

    const hand = this.ensurePlayerHand(playerId);
    const drawnCard = turn.drawnCard;
    const hasSavedCard = hand.items.length >= 1;
    const isBathroomCard = drawnCard.value === 10;
    const currentMode = this.gameState.roomConfig.gameMode || 'normal';

    if (this.isSoloMode) {
      throw new Error(
        isBathroomCard
          ? 'No modo solo, a carta Banheiro deve ser usada adicionando o nome da pessoa.'
          : 'No modo solo, as cartas não devem ser guardadas.'
      );
    }

    if (currentMode === 'normal' && !isBathroomCard) {
      throw new Error('No modo normal, só é permitido guardar cartas de Banheiro.');
    }

    if (currentMode === 'normal') {
      if (hasSavedCard) {
        const oldCard = hand.items.shift();

        if (oldCard) {
          this.gameState.discardPile.push(oldCard);

          this.addGameLog(
            playerId,
            'Banheiro substituído',
            `${this.gameState.players.get(playerId)?.name || 'Jogador'} substituiu a carta Banheiro guardada por outra carta Banheiro.`,
            oldCard
          );
        }
      }

      hand.items.push(drawnCard);

      turn.keptCard = drawnCard;
      turn.actionTaken = 'kept';

      this.addGameLog(
        playerId,
        'Banheiro guardado',
        `${this.gameState.players.get(playerId)?.name || 'Jogador'} guardou uma carta Banheiro.`,
        drawnCard
      );

      this.finishCurrentTurn();
      return;
    }

    if (currentMode === 'bonus') {
      if (hasSavedCard) {
        const oldCard = hand.items.shift();

        if (oldCard) {
          this.forceUseStoredCard(playerId, oldCard);
        }
      }

      hand.items.push(drawnCard);

      turn.keptCard = drawnCard;
      turn.actionTaken = 'kept';

      this.addGameLog(
        playerId,
        'Carta guardada',
        `${this.gameState.players.get(playerId)?.name || 'Jogador'} guardou ${drawnCard.name}.`,
        drawnCard
      );

      this.finishCurrentTurn();
      return;
    }

    throw new Error('Modo de jogo inválido.');
  }

  addGeneralRuleFromDrawnCard(playerId: string, text: string): void {
    const turn = this.gameState.currentTurn;

    if (this.gameState.status !== 'active') {
      throw new Error('O jogo ainda não está ativo.');
    }

    if (turn.currentPlayerId !== playerId) {
      throw new Error('Ainda não é sua vez.');
    }

    if (!turn.drawnCard) {
      throw new Error('Compre uma carta primeiro.');
    }

    if (turn.drawnCard.value !== 8) {
      throw new Error('A carta comprada não é Regra Geral.');
    }

    const cleanText = text.trim();

    if (!cleanText) {
      throw new Error('Digite a regra geral antes de usar a carta.');
    }

    const alreadyUsed = this.gameState.generalRules.some(
      (rule) => rule.cardId === turn.drawnCard?.id
    );

    if (alreadyUsed) {
      throw new Error('Essa carta já gerou uma regra geral.');
    }

    const player = this.gameState.players.get(playerId);
    const rule = this.getRuleFromCard(turn.drawnCard);

    turn.drawnCard.ruleTitle = rule.title;
    turn.drawnCard.ruleDescription = cleanText;

    this.gameState.generalRules.push({
      id: `general_rule_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      text: cleanText,
      cardId: turn.drawnCard.id,
      playerId,
      playerName: player?.name || 'Jogador',
      createdAt: new Date(),
    });

    turn.playedCard = turn.drawnCard;
    turn.actionTaken = 'played';

    this.gameState.discardPile.push(turn.drawnCard);

    this.addGameLog(
      playerId,
      'Regra geral criada',
      `${player?.name || 'Jogador'} criou uma regra geral: "${cleanText}".`,
      turn.drawnCard
    );

    this.finishCurrentTurn();
  }

  playDrawnCard(playerId: string): void {
    const turn = this.gameState.currentTurn;

    if (turn.currentPlayerId !== playerId) {
      throw new Error('Ainda não é sua vez.');
    }

    if (!turn.drawnCard) {
      throw new Error('Compre uma carta primeiro.');
    }

    const rule = this.getRuleFromCard(turn.drawnCard);

    turn.drawnCard.ruleTitle = rule.title;
    turn.drawnCard.ruleDescription = rule.description;

    turn.playedCard = turn.drawnCard;
    turn.actionTaken = 'played';

    this.applyCardEffect(playerId, turn.drawnCard);
    this.gameState.discardPile.push(turn.drawnCard);

    const shouldShowInHistory = turn.drawnCard.value !== 4;

    if (shouldShowInHistory) {
      this.addGameLog(
        playerId,
        'Carta usada',
        `${this.gameState.players.get(playerId)?.name || 'Jogador'} usou ${turn.drawnCard.name}: ${rule.title} — ${rule.description}`,
        turn.drawnCard
      );
    }

    this.finishCurrentTurn();
  }
  
  playSavedCard(playerId: string, cardId: string): void {
    const hand = this.ensurePlayerHand(playerId);
    const cardIndex = hand.items.findIndex((item) => item.id === cardId);

    if (cardIndex < 0) {
      throw new Error('Carta não encontrada na sua mão.');
    }

    const card = hand.items.splice(cardIndex, 1)[0];
    const rule = this.getRuleFromCard(card);

    card.ruleTitle = rule.title;
    card.ruleDescription = rule.description;

    this.applyCardEffect(playerId, card);
    this.gameState.discardPile.push(card);

    const shouldShowInHistory = card.value !== 4;

    if (shouldShowInHistory) {
      this.addGameLog(
        playerId,
        'Carta guardada usada',
        `${this.gameState.players.get(playerId)?.name || 'Jogador'} usou a carta guardada ${card.name}: ${rule.title} — ${rule.description}`,
        card
      );
    }

    this.syncStateToFirestore();

    this.emit('card_played', {
      playerId,
      cardName: card.name,
      category: card.category,
      value: card.value,
    });
  }

  tradeBathroomCard(playerId: string): void {
    this.keepDrawnCard(playerId);
  }


  useBathroomFromDrawnCard(playerId: string, name?: string): void {
    const turn = this.gameState.currentTurn;

    if (this.gameState.status !== 'active') {
      throw new Error('O jogo ainda não está ativo.');
    }

    if (turn.currentPlayerId !== playerId) {
      throw new Error('Ainda não é sua vez.');
    }

    if (!turn.drawnCard) {
      throw new Error('Compre uma carta primeiro.');
    }

    if (turn.drawnCard.value !== 10) {
      throw new Error('A carta comprada não é Banheiro.');
    }

    const player = this.gameState.players.get(playerId);
    const cleanName = name?.trim() || '';

    if (this.isSoloMode && !cleanName) {
      throw new Error('Digite o nome da pessoa que ficou com a carta Banheiro.');
    }

    const rule = this.getRuleFromCard(turn.drawnCard);

    turn.drawnCard.ruleTitle = rule.title;
    turn.drawnCard.ruleDescription = rule.description;

    turn.playedCard = turn.drawnCard;
    turn.actionTaken = 'played';

    this.gameState.discardPile.push(turn.drawnCard);

    if (this.isSoloMode) {
      const pass = {
        id: `bathroom_pass_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: cleanName,
        cardId: turn.drawnCard.id,
        playerId,
        createdAt: new Date(),
      };

      this.gameState.bathroomPasses.push(pass);

      this.addGameLog(
        playerId,
        'Banheiro adicionado',
        `${cleanName} recebeu uma carta Banheiro.`,
        turn.drawnCard
      );
    } else {
      this.addGameLog(
        playerId,
        'Banheiro usado',
        `${player?.name || 'Jogador'} usou a carta Banheiro.`,
        turn.drawnCard
      );
    }

    this.finishCurrentTurn();
  }

  private isBonusDrinkCard(card: Item): boolean {
    return ['drink', 'king_cup'].includes(card.actionType || '');
  }

  private forceUseStoredCard(playerId: string, card: Item): void {
    const player = this.gameState.players.get(playerId);
    const rule = this.getRuleFromCard(card);

    card.ruleTitle = rule.title;
    card.ruleDescription = rule.description;

    this.applyCardEffect(playerId, card);
    this.gameState.discardPile.push(card);

    if (card.actionType === 'joker') {
      this.addGameLog(
        playerId,
        'Coringa usado fora da votação',
        `${player?.name || 'Jogador'} usou Coringa fora da votação e bebe 3 doses.`,
        card
      );

      return;
    }

    if (card.value === 10) {
      this.addGameLog(
        playerId,
        'Banheiro usado automaticamente',
        `${player?.name || 'Jogador'} usou/descartou a carta Banheiro guardada antes de guardar outra carta.`,
        card
      );

      return;
    }

    this.addGameLog(
      playerId,
      'Carta guardada usada automaticamente',
      `${player?.name || 'Jogador'} usou automaticamente a carta guardada ${card.name}: ${rule.title} — ${rule.description}`,
      card
    );
  }

  private applyCardEffect(playerId: string, card: Item): void {
    if (card.value === 13) {
      this.gameState.kingCupCount += 1;

      if (this.gameState.kingCupCount >= 4) {
        this.addGameLog(
          playerId,
          'Rei do Copo',
          'Saiu o 4º Rei. O jogador deve virar o copo central.',
          card
        );
      } else {
        this.addGameLog(
          playerId,
          'Rei do Copo',
          `Rei ${this.gameState.kingCupCount}/4. O jogador coloca bebida no copo central.`,
          card
        );
      }
    }
  }
  private finishCurrentTurn(): void {
    const finishedTurn = this.gameState.currentTurn;

    this.gameState.turns.push(finishedTurn);
    this.gameState.gameHistory.push(finishedTurn);

    const players = this.getPlayerOrder();
    const nextPlayerId = this.getNextPlayerId(finishedTurn.currentPlayerId);

    const finishedFullRound = nextPlayerId === players[0];

    if (finishedFullRound) {
      this.resetRoundTradeOptions();

      if (this.gameState.roomConfig.gameMode === 'bonus') {
        this.startRoundVote();
        this.syncStateToFirestore();

        this.emit('round_ended', {
          round: this.gameState.round,
          voteStarted: true,
        });

        return;
      }

      this.gameState.round += 1;
    }

    this.startTurn(nextPlayerId);
    this.syncStateToFirestore();

    this.emit('turn_ended', {
      nextPlayerId,
      round: this.gameState.round,
    });
  }
  private resetRoundTradeOptions(): void {
    const reset: Record<string, boolean> = {};

    this.gameState.players.forEach((_player, playerId) => {
      reset[playerId] = false;
    });

    this.gameState.tradeLockedPlayers = reset;
  }

  private syncStateToFirestore(): void {
    if (this.isSoloMode) {
      return;
    }

    FirestoreManager.updateGameState(this.roomId, this.gameState).catch((error) => {
      console.error('Erro ao sincronizar estado do jogo:', error);
    });
  }

  finishGame(): void {
    this.gameState.status = 'finished';
    this.gameState.roomConfig.status = 'finished';
    this.gameState.roomConfig.endedAt = new Date();

    FirestoreManager.finishGame(this.roomId, Array.from(this.gameState.players.values())).catch(
      (error) => {
        console.error('Erro ao finalizar jogo:', error);
      }
    );

    this.emit('game_finished', {
      status: 'ended',
    });
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
  private getRuleFromCard(card: Item) {
    if (card.ruleTitle && card.ruleDescription) {
      return {
        title: card.ruleTitle,
        description: card.ruleDescription,
      };
    }

    const rule = this.getCardRule(card.value);

    return {
      title: rule.title,
      description: rule.description,
    };
  }

  private startRoundVote(): void {
    const now = new Date();
    const endsAt = new Date(now.getTime() + 45 * 1000);

    this.gameState.status = 'round_vote';

    this.gameState.roundVote = {
      active: true,
      roundNumber: this.gameState.round,
      startedAt: now,
      endsAt,
      votes: {},
      jokerUsers: [],
    };

    this.addGameLog(
      'system',
      'Votação bônus',
      `Fim da rodada ${this.gameState.round}. Votação secreta iniciada por 45 segundos.`,
      null
    );
  }

  voteForPlayer(voterId: string, targetPlayerId: string): void {
    if (this.gameState.status !== 'round_vote' || !this.gameState.roundVote?.active) {
      throw new Error('A votação não está ativa.');
    }

    if (!this.gameState.players.has(voterId)) {
      throw new Error('Jogador inválido.');
    }

    if (!this.gameState.players.has(targetPlayerId)) {
      throw new Error('Alvo inválido.');
    }

    this.gameState.roundVote.votes[voterId] = targetPlayerId;
    this.syncStateToFirestore();
  }

  useBathroomPass(passId: string): void {
    const passIndex = this.gameState.bathroomPasses.findIndex(
      (pass) => pass.id === passId
    );

    if (passIndex < 0) {
      throw new Error('Carta Banheiro não encontrada.');
    }

    const [pass] = this.gameState.bathroomPasses.splice(passIndex, 1);

    this.addGameLog(
      pass.playerId,
      'Banheiro usado',
      `${pass.name} usou a carta Banheiro.`,
      null
    );

    this.syncStateToFirestore();
  }

  removeBathroomPass(passId: string): void {
    const passIndex = this.gameState.bathroomPasses.findIndex(
      (pass) => pass.id === passId
    );

    if (passIndex < 0) {
      throw new Error('Carta Banheiro não encontrada.');
    }

    const [pass] = this.gameState.bathroomPasses.splice(passIndex, 1);

    this.addGameLog(
      pass.playerId,
      'Banheiro removido',
      `Carta Banheiro de ${pass.name} removida.`,
      null
    );

    this.syncStateToFirestore();
  }

  useJokerInRoundVote(playerId: string): void {
    if (this.gameState.status !== 'round_vote' || !this.gameState.roundVote?.active) {
      throw new Error('A votação não está ativa.');
    }

    if (this.gameState.roundVote.jokerUsers.includes(playerId)) {
      throw new Error('Você já usou um coringa nesta votação.');
    }

    const hand = this.ensurePlayerHand(playerId);
    const jokerIndex = hand.items.findIndex((item) => item.actionType === 'joker');

    if (jokerIndex < 0) {
      throw new Error('Você não tem coringa guardado.');
    }

    const joker = hand.items.splice(jokerIndex, 1)[0];
    this.gameState.discardPile.push(joker);
    this.gameState.roundVote.jokerUsers.push(playerId);

    this.syncStateToFirestore();
  }

  finishRoundVote(): void {
    const vote = this.gameState.roundVote;

    if (!vote?.active) {
      throw new Error('Nenhuma votação ativa.');
    }

    const counts: Record<string, number> = {};

    Object.values(vote.votes).forEach((targetPlayerId) => {
      counts[targetPlayerId] = (counts[targetPlayerId] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [targetPlayerId, voteCount] = sorted[0] || [];

    if (!targetPlayerId) {
      this.addGameLog(
        'system',
        'Votação encerrada',
        'Ninguém votou. A rodada terminou sem dose bônus.',
        null
      );
    } else {
      const targetPlayer = this.gameState.players.get(targetPlayerId);
      const extraDoses = vote.jokerUsers.length;
      const totalDoses = 1 + extraDoses;

      vote.result = {
        targetPlayerId,
        targetPlayerName: targetPlayer?.name || 'Jogador',
        votes: voteCount,
        extraDoses,
        totalDoses,
      };

      this.addGameLog(
        'system',
        'Resultado da votação',
        `${targetPlayer?.name || 'Jogador'} foi o mais votado e bebe ${totalDoses} dose(s). ${extraDoses > 0 ? `+${extraDoses} por coringa.` : ''}`,
        null
      );
    }

    vote.active = false;
    this.gameState.status = 'active';
    this.gameState.round += 1;

    const firstPlayerId = this.getPlayerOrder()[0];
    this.startTurn(firstPlayerId);

    this.syncStateToFirestore();
  }
  kickPlayerByHost(hostId: string, targetPlayerId: string): void {
    if (this.gameState.roomConfig.hostId !== hostId) {
      throw new Error('Apenas o host pode banir jogadores.');
    }

    if (hostId === targetPlayerId) {
      throw new Error('O host não pode banir a si mesmo.');
    }

    const player = this.gameState.players.get(targetPlayerId);

    if (!player) {
      throw new Error('Jogador não encontrado.');
    }

    player.isActive = false;
    this.gameState.players.delete(targetPlayerId);
    this.gameState.playerHands.delete(targetPlayerId);
    this.gameState.roomConfig.currentPlayers = this.gameState.players.size;

    this.addGameLog(
      'system',
      'Jogador removido',
      `${player.name} foi removido da partida pelo host.`,
      null
    );

    this.syncStateToFirestore();
  }

  transferHost(currentHostId: string, newHostId: string): void {
    if (this.gameState.roomConfig.hostId !== currentHostId) {
      throw new Error('Apenas o host atual pode transferir o host.');
    }

    if (!this.gameState.players.has(newHostId)) {
      throw new Error('Novo host inválido.');
    }

    this.gameState.roomConfig.hostId = newHostId;

    const newHost = this.gameState.players.get(newHostId);

    this.addGameLog(
      'system',
      'Host alterado',
      `${newHost?.name || 'Jogador'} agora é o host da partida.`,
      null
    );

    this.syncStateToFirestore();
  }
}