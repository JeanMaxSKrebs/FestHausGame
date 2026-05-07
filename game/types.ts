/**
 * Tipos e Interfaces para o Game Engine
 * Sistema de Jogo de Turnos com Pool Dinâmico de Itens
 */

// ============== ITEM/CARD TYPES ==============
export type ItemCategory = 'espadas' | 'ouro' | 'copas' | 'paus';
export type ItemRarity = 'comum' | 'raro' | 'épico' | 'lendário';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  value: number; // 1-12, peso/poder do item
  rarity: ItemRarity;
  isTrump?: boolean; // Se é um trunfo
}

export interface PlayerHand {
  playerId: string;
  items: Item[];
  isLeader: boolean;
  isTrumpLeader?: boolean;
  score: number;
}

// ============== ROOM TYPES ==============
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
}

// ============== PLAYER TYPES ==============
export interface Player {
  id: string;
  name: string;
  phone: string; // Para WhatsApp integration
  email?: string;
  profileImage?: string;
  joinedAt: Date;
  isActive: boolean;
  isMidGameJoin?: boolean;
}

// ============== TURN TYPES ==============
export interface Turn {
  roundNumber: number;
  turnNumber: number;
  leaderId: string;
  trumpCategory?: ItemCategory;
  trumpLeaderId?: string;
  playedCards: Map<string, Item>; // playerId -> item jogado
  winnerPlayerId?: string;
  timestamp: Date;
}

// ============== GAME STATE ==============
export interface GameState {
  roomId: string;
  roomConfig: RoomConfig;
  players: Map<string, Player>;
  playerHands: Map<string, PlayerHand>;
  itemPool: Item[];
  currentTurn: Turn;
  turns: Turn[];
  round: number;
  gameHistory: Turn[];
  status: 'waiting' | 'active' | 'paused' | 'finished';
  rankings: {
    playerId: string;
    finalScore: number;
    position: number;
  }[];
}

// ============== ITEM POOL CONFIG ==============
export interface ItemPoolConfig {
  maxPlayers: number;
  totalItems: number; // Variável baseado em maxPlayers
  categoriesDistribution: Record<ItemCategory, number>;
  rarityDistribution: Record<ItemRarity, number>;
}

// ============== VALIDATION RESULT ==============
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  canPlayTrump?: boolean;
  mustFollowCategory?: boolean;
}

// ============== GAME EVENTS ==============
export type GameEventType =
  | 'player_joined'
  | 'player_left'
  | 'turn_started'
  | 'card_played'
  | 'card_distributed'
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

// ============== WHATSAPP INVITE ==============
export interface WhatsAppInvite {
  roomId: string;
  hostName: string;
  inviteLink: string;
  expiresAt: Date;
  deepLink: string;
}
