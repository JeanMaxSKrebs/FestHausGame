# 📐 Arquitetura - Fest Haus Game

## Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER INTERFACE LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  SignIn      │  │  SignUp      │  │  Home                │  │
│  │  Screen      │──→ Screen      │──→ Screen               │  │
│  └──────┬───────┘  └──────────────┘  └──────┬───────────────┘  │
│         │                                    │                 │
│         └────────────────────────────────────┼─────────────────┤
│                                              │                 │
│         ┌──────────────────────────────────┐ │                 │
│         │      Game Screen                 ├─┘                 │
│         │  ┌────────────────┐              │                   │
│         │  │ Lobby          │              │                   │
│         │  ├────────────────┤              │                   │
│         │  │ Gameplay       │              │                   │
│         │  └────────────────┘              │                   │
│         └──────┬───────────────────────────┘                   │
└────────────────┼────────────────────────────────────────────────┘
                 │
┌────────────────┼────────────────────────────────────────────────┐
│                │         STATE MANAGEMENT                       │
│         ┌──────┴──────────┐                                     │
│         │ AuthUserContext │────→ Firebase Auth                  │
│         │ (useContext)    │                                     │
│         └────────┬────────┘                                     │
│                  │                                              │
│    ┌─────────────┴─────────┐                                    │
│    │  GameManager          │                                    │
│    │  ┌──────────────────┐ │                                    │
│    │  │ gameState        │ │                                    │
│    │  │ - players        │ │                                    │
│    │  │ - hands          │ │                                    │
│    │  │ - itemPool       │ │                                    │
│    │  │ - currentTurn    │ │                                    │
│    │  └──────────────────┘ │                                    │
│    │                        │                                    │
│    │ Methods:              │                                    │
│    │ - playCard()          │                                    │
│    │ - startGame()         │                                    │
│    │ - endTurn()           │                                    │
│    │ - joinMidGame()       │                                    │
│    │ - validateCardPlay()  │                                    │
│    │                        │                                    │
│    │ Events:               │                                    │
│    │ - turn_started        │                                    │
│    │ - card_played         │                                    │
│    │ - round_ended         │                                    │
│    │ - game_finished       │                                    │
│    └─────────────┬─────────┘                                    │
└─────────────────┼────────────────────────────────────────────────┘
                  │
┌─────────────────┼────────────────────────────────────────────────┐
│                 │        INTEGRATIONS & SERVICES                │
│                 │                                               │
│         ┌───────┴────────────┐                                  │
│         │ WhatsAppBridge     │                                  │
│         │ ┌────────────────┐ │                                  │
│         │ │generateInvite()│ │────→ Generate Link              │
│         │ │sendViaWhatsApp│ │────→ Open WhatsApp              │
│         │ │validateInvite()│ │────→ Check Expiry              │
│         │ └────────────────┘ │                                  │
│         │ Deep Linking        │                                  │
│         │ - setupHandler()    │                                  │
│         │ - festhausgame://   │                                  │
│         └────────────────────┘                                  │
│                                                                 │
│         ┌──────────────────────────────────────────────┐        │
│         │ Firebase Services                           │        │
│         │ ┌────────────────┐  ┌──────────────────┐   │        │
│         │ │ Firebase Auth  │  │ Firestore (TODO) │   │        │
│         │ │ - signIn()     │  │ - Collections    │   │        │
│         │ │ - signUp()     │  │ - Real-time sync │   │        │
│         │ │ - Google OAuth │  │ - Listeners      │   │        │
│         │ └────────────────┘  └──────────────────┘   │        │
│         └──────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DATA & STORAGE LAYER                        │
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │ expo-secure-store    │      │ Firebase Auth        │        │
│  │ (Encrypted)          │      │ (Remote)             │        │
│  │ - user_session       │      │ - email/password     │        │
│  │ - invites            │      │ - google token       │        │
│  └──────────────────────┘      └──────────────────────┘        │
│                                                                 │
│        (⏳ TODO: Firestore Collections for Multiplayer)        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App (RootLayout)
│
├── AuthUserProvider (Context)
│   │
│   ├── RootLayoutNav
│   │
│   ├─→ [Unauthenticated Users]
│   │   ├── SignIn Screen
│   │   │   ├── EmailInput
│   │   │   ├── PhoneInput (formatted)
│   │   │   ├── PasswordInput
│   │   │   ├── GoogleSignInButton
│   │   │   └── SignUpLink
│   │   │
│   │   └── SignUp Screen
│   │       ├── NameInput
│   │       ├── EmailInput
│   │       ├── PasswordInput
│   │       └── CreateAccountButton
│   │
│   └─→ [Authenticated Users]
│       │
│       ├── (Tabs Navigator)
│       │   ├── Explore Tab
│       │   └── Home Tab
│       │
│       ├── Home Screen
│       │   ├── UserCard
│       │   │   ├── ProfileImage
│       │   │   ├── UserName
│       │   │   └── UserEmail
│       │   │
│       │   ├── GameOptions
│       │   │   ├── CreateWaitingRoomButton
│       │   │   ├── CreateWhatsAppInviteButton
│       │   │   └── JoinRoomButton
│       │   │
│       │   ├── StatsDisplay
│       │   │   ├── Matches Count
│       │   │   ├── Wins Count
│       │   │   └── Points Count
│       │   │
│       │   └── LogoutButton
│       │
│       ├── Game Screen
│       │   ├── Lobby View
│       │   │   ├── RoomInfo
│       │   │   ├── PlayersList
│       │   │   │   ├── PlayerCard (repeated)
│       │   │   │   └── JoinButton/StartButton
│       │   │   └── ShareInviteButton
│       │   │
│       │   └── GameView
│       │       ├── GameHeader
│       │       │   ├── CurrentLeader
│       │       │   ├── TrumpCategory
│       │       │   └── ScoreBoard
│       │       │
│       │       ├── OpponentCards
│       │       │   ├── OpponentCard (repeated)
│       │       │   └── CardCount Badges
│       │       │
│       │       ├── TableDisplay
│       │       │   ├── PlayedCards Preview
│       │       │   └── TrumpIndicator
│       │       │
│       │       ├── MyHand
│       │       │   └── CardButton (repeated)
│       │       │       └── Press to play
│       │       │
│       │       └── ActionButtons
│       │           ├── ShareInvite
│       │           └── LeaveRoom
│       │
│       └── Modal Screen
```

---

## Data Flow Diagram

```
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│ UI Component (Game Screen)      │
│ handlePlayCard(cardId)          │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ GameManager.playCard()          │
│ 1. Validate card (rules)        │
│ 2. Update state                 │
│ 3. Emit event                   │
└──────┬──────────────────────────┘
       │
       ├─→ Emit 'card_played'
       │
       ▼
┌─────────────────────────────────┐
│ GameState Updated               │
│ - hands modified                │
│ - currentTurn.playedCards       │
│ - scores calculated             │
└──────┬──────────────────────────┘
       │
       ├─→ Event Listener (Game.tsx)
       │
       ▼
┌─────────────────────────────────┐
│ UI Updates via React            │
│ setGameState(new state)         │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Component Re-render             │
│ - Hand updated                  │
│ - Play history shown            │
│ - Score updated                 │
└─────────────────────────────────┘
```

---

## Game State Management

```
                    GameManager Instance
                           │
                    ┌──────┴───────┐
                    │              │
              gameState        Players[]
              (RoomConfig)      (Array)
                    │
        ┌───────────┼───────────────┐
        │           │               │
    currentTurn   players[] hands[] itemPool[]
        │                              │
    ┌───┴────┐                         └─→ Shuffled Cards
    │        │
leaderId  Round
    │
trumpCategory
    │
playedCards Map<playerId, card>
```

---

## Firebase Integration (Current)

```
┌──────────────────────────────────┐
│    Firebase Authentication       │
├──────────────────────────────────┤
│ ✅ Email/Password                │
│ ✅ Google OAuth                  │
│ ✅ Session Persistence           │
│ ✅ Secure Storage (expo-*)       │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│    Firebase Firestore (TODO)     │
├──────────────────────────────────┤
│ ⏳ rooms/                        │
│ ⏳ rooms/{id}/players/           │
│ ⏳ rooms/{id}/turns/             │
│ ⏳ users/                        │
│ ⏳ Real-time listeners           │
│ ⏳ Server validation             │
└──────────────────────────────────┘
```

---

## Communication Flow

```
Player 1 (Device A)          Player 2 (Device B)
       │                             │
       │  1. Click "Create Room"     │
       ├──→ GameManager.startGame()  │
       │                             │
       │  2. Generate Invite         │
       ├──→ WhatsAppBridge.generate()│
       │                             │
       │  3. Share via WhatsApp      │
       ├──────────────→ [WhatsApp]   │
       │                      │      │
       │                      └─────→│
       │                             ├──→ Tap Link
       │                             ├──→ festhausgame://room/id
       │                             ├──→ App Opens
       │                             │
       │ 4. (TODO) Firestore Sync   │
       ├────────── Firestore ────────┤
       │  - roomId                   │
       │  - players[]                │
       │  - gameState                │
       │  - currentTurn              │
       │                             │
       │  5. Real-time Update        │
       │ (onSnapshot Listener)       │
       │  ┌────────────────────┐     │
       │  │ Player 2 joined    │────→│ Update UI
       │  │ New turn started   │────→│
       │  │ Player 1 played    │────→│
       │  └────────────────────┘     │
       │                             │
```

---

## Types & Relationships

```
Player
  ├── id: string
  ├── name: string
  ├── email: string
  ├── phone: string
  └── profileImage?: string

Item (Card)
  ├── id: string
  ├── name: string
  ├── category: ItemCategory (naipe)
  ├── value: 1-12
  ├── rarity: ItemRarity
  └── isTrump?: boolean

PlayerHand
  ├── playerId: string
  ├── items: Item[]
  ├── isLeader: boolean
  ├── isTrumpLeader?: boolean
  └── score: number

Turn
  ├── leaderId: string
  ├── round: number
  ├── trumpCategory: ItemCategory
  ├── playedCards: Map<playerId, Item>
  └── timestamp: Date

GameState
  ├── roomId: string
  ├── players: Player[]
  ├── hands: Map<playerId, PlayerHand>
  ├── currentTurn: Turn
  ├── itemPool: Item[]
  ├── rankings: Player[]
  ├── isGameFinished: boolean
  └── maxPlayers: number

RoomConfig
  ├── roomType: 'waiting_room' | 'direct_invite'
  ├── roomId: string
  ├── createdBy: string
  ├── maxPlayers: number
  └── status: 'looking' | 'playing' | 'finished'
```

---

## Event Flow

```
startGame()
    │
    ├─→ emit('turn_started')
    │   └─→ UI Updates leader & trump
    │
playCard()
    │
    ├─→ emit('card_played')
    │   └─→ UI Animates card
    │
    ├─→ [Check if all played]
    │
endTurn()
    │
    ├─→ emit('round_ended')
    │   └─→ UI Shows winner & score
    │
    └─→ [If game not finished → turn_started again]
        else → emit('game_finished')
            └─→ Show final rankings

game_finished
    │
    └─→ Save stats to Firestore (TODO)
```

---

## Scalability Considerations

### **Current Limits**
- Max players: 12
- Pool size: 10 * players + 2
- Event listeners: Per-game client instance

### **Future Bottlenecks** (After Firestore)
- Message queue for card plays (prevent collision)
- Server-side validation (anti-cheat)
- Batch writes to reduce Firestore costs
- Caching for frequently accessed data

### **Optimization Opportunities**
- [ ] Lazy load cards images
- [ ] Compress state updates (delta sync)
- [ ] Rate limit card plays
- [ ] Debounce UI updates
- [ ] Connection pooling

---

## Environment & Deployment

```
Development (Local)
    ├── npm start
    ├── Expo Go app
    ├── Firebase emulator (optional)
    └── Hot reload

Production (EAS Build)
    ├── eas build --platform android
    ├── eas build --platform ios
    ├── Firebase production project
    ├── Deep link scheme registered
    └── App stores
```

---

**Last Updated:** Dezembro 2024
