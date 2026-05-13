/**
 * Tipos do Fest Haus Game
 * Jogo estilo copo central / baralho no meio.
 */

export type GameMode = 'normal' | 'bonus';

export type ItemCategory = 'espadas' | 'ouro' | 'copas' | 'paus' | 'coringa';

export interface RoundVoteState {
  active: boolean;
  roundNumber: number;
  startedAt: Date;
  endsAt: Date;
  votes: Record<string, string>; // playerId -> targetPlayerId
  jokerUsers: string[]; // quem usou coringa
  result?: {
    targetPlayerId: string;
    targetPlayerName: string;
    votes: number;
    extraDoses: number;
    totalDoses: number;
  };
}

export type CardActionType =
  | 'drink'
  | 'table_finger'
  | 'mini_game'
  | 'rule'
  | 'bathroom'
  | 'king_cup'
  | 'joker';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  value: number;
  isTrump?: boolean;

  ruleTitle?: string;
  ruleDescription?: string;
  actionType?: CardActionType;
}

export interface PlayerHand {
  playerId: string;
  items: Item[];
  isLeader: boolean;
  isTrumpLeader?: boolean;
  score: number;
}

export type RoomType = 'waiting_room' | 'direct_invite';

export interface RoomConfig {
  roomId: string;
  roomType: RoomType;
  hostId: string;
  maxPlayers: number;
  currentPlayers: number;
  status: 'lobby' | 'playing' | 'finished';
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  whatsappInviteLink?: string;
  gameMode?: GameMode;

  deckMultiplier?: number;
  virtualPlayerCount?: number;
  secretVoteEnabled?: boolean;
}

export interface Player {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profileImage?: string;
  joinedAt: Date;
  isActive: boolean;
  isMidGameJoin?: boolean;
}

export interface Turn {
  roundNumber: number;
  turnNumber: number;
  leaderId: string;
  currentPlayerId: string;
  drawnCard?: Item | null;
  keptCard?: Item | null;
  playedCard?: Item | null;
  actionTaken?: 'drawn' | 'kept' | 'played' | 'skipped';
  timestamp: Date;
}

export interface GameLogEntry {
  id: string;
  playerId: string;
  playerName: string;
  card?: Item | null;
  action: string;
  description: string;
  createdAt: Date;
}

export interface GameState {
  roomId: string;
  roomConfig: RoomConfig;
  players: Map<string, Player>;
  playerHands: Map<string, PlayerHand>;
  itemPool: Item[];
  discardPile: Item[];
  currentTurn: Turn;
  turns: Turn[];
  round: number;
  gameHistory: Turn[];
  gameLog: GameLogEntry[];
  status: 'waiting' | 'active' | 'round_vote' | 'paused' | 'finished';
  rankings: Array<{
    playerId: string;
    finalScore: number;
    position: number;
  }>;
  kingCupCount: number;
  roundVote?: RoundVoteState;
  tradeLockedPlayers: Record<string, boolean>;
  generalRules: GeneralRuleEntry[];
  bathroomPasses: BathroomPassEntry[];
}

export interface ItemPoolConfig {
  maxPlayers: number;
  totalItems: number;
  categoriesDistribution: Partial<Record<ItemCategory, number>>;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  canPlayTrump?: boolean;
  mustFollowCategory?: boolean;
}

export interface GeneralRuleEntry {
  id: string;
  text: string;
  cardId: string;
  playerId: string;
  playerName: string;
  createdAt: Date;
}

export interface BathroomPassEntry {
  id: string;
  name: string;
  cardId: string;
  playerId: string;
  createdAt: Date;
}

export type GameEventType =
  | 'player_joined'
  | 'player_left'
  | 'turn_started'
  | 'card_drawn'
  | 'card_kept'
  | 'card_played'
  | 'turn_ended'
  | 'round_ended'
  | 'game_finished'
  | 'mid_game_join';

export interface GameEvent {
  type: GameEventType;
  timestamp: Date;
  playerId?: string;
  data: any;
}

export interface WhatsAppInvite {
  roomId: string;
  hostName: string;
  inviteLink: string;
  expiresAt: Date;
  deepLink: string;
}