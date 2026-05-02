# 📐 Arquitetura - Fest Haus Game

## Stack Técnico Atual

### **Frontend**
- **Expo** v55.0.33 (React Native multiplataforma)
- **React** 19.1.0 com Hooks
- **React Native** 0.81.5 (engine mobile)
- **TypeScript** 5.9.2 (type-safe)
- **Expo Router** 6.0.23 (file-based routing, deep linking)
- **React Navigation** (Tab + Stack navigation)
- **React Native Reanimated** 4.1.1 (animations)
- **React Native Gesture Handler** 2.28.0 (touch interactions)

### **Backend & Services**
- **Firebase Authentication** (Web SDK v12.11.0)
  - Email/Password auth
  - Google OAuth (expo-google-signin)
  - Session persistence (expo-secure-store)
- **Firebase Firestore** (Real-time database)
  - Collections: rooms, users, statistics
  - Real-time listeners (onSnapshot)
  - Server-side validation with security rules
- **WhatsApp Integration** (Deep linking + invites)

### **Storage & Config**
- **expo-secure-store** (Encrypted session storage)
- **app.json** (Expo configuration)
- **.env** (Environment variables, git-ignored)
- **firebase.json** (Firebase CLI config)

---

## 📁 Estrutura de Pastas - O que Cada uma Faz

```
FestHausGame/
│
├── 📱 app/                          # Telas e Roteamento (Expo Router)
│   ├── _layout.tsx                  # Layout raiz + Deep link handler
│   ├── index.tsx                    # Root route (redireciona auth)
│   ├── modal.tsx                    # Modal screen
│   ├── (tabs)/                      # Tab navigator (explorável)
│   │
│   └── screens/                     # Telas principais do app
│       ├── _layout.tsx              # Layout do grupo de screens
│       ├── SignIn/
│       │   └── index.tsx            # 🔐 Tela de login
│       │                            #    - Email + Senha
│       │                            #    - Google Sign-in
│       │                            #    - Link para SignUp
│       │
│       ├── SignUp/
│       │   └── index.tsx            # 📝 Tela de cadastro
│       │                            #    - Nome, Email, Senha
│       │                            #    - Confirmação de senha
│       │
│       ├── Home/
│       │   └── index.tsx            # 🏠 Menu principal (pós-login)
│       │                            #    - Perfil do usuário
│       │                            #    - 3 opções de jogo
│       │                            #    - Estatísticas
│       │                            #    - Logout
│       │
│       └── Game/
│           └── index.tsx            # 🎮 Tela principal do jogo
│                                    #    - Lobby (aguardando players)
│                                    #    - Gameplay (mão + mesa)
│                                    #    - Real-time sync com Firestore
│
├── 🎲 game/                         # Game Engine - Core Logic
│   ├── types.ts                     # 📋 Tipos TypeScript
│   │                                #    - Item, Card, Player, Hand
│   │                                #    - GameState, Turn, Room
│   │                                #    - GameEvent, GameEventType
│   │
│   ├── GameManager.ts               # 🎯 Motor de Jogo (~400 linhas)
│   │                                #    - Inicializar jogo
│   │                                #    - Distribuir cartas
│   │                                #    - Validar jogadas (regras)
│   │                                #    - Calcular pontuação
│   │                                #    - Hot-join mid-game
│   │                                #    - Event system
│   │
│   ├── FirestoreManager.ts          # 🔥 Sync com Firestore (~450 linhas)
│   │                                #    - Create/join rooms
│   │                                #    - Real-time listeners
│   │                                #    - Turn updates
│   │                                #    - Score persistence
│   │                                #    - Player management
│   │
│   └── WhatsAppBridge.ts            # 💬 Integração Social (~250 linhas)
│                                    #    - Gerar links de convite
│                                    #    - Validação de convites (24h)
│                                    #    - Enviar via WhatsApp
│
├── 🔑 context/                      # Estado Global (React Context)
│   └── AuthUserProvider.tsx         # 🔐 Contexto de Autenticação
│                                    #    - Usuário atual (ou null)
│                                    #    - Loading state
│                                    #    - Login/Logout/SignUp
│                                    #    - Refresh session
│
├── 🎣 hooks/                        # Custom React Hooks
│   ├── use-color-scheme.ts          # 🌓 Detecta dark/light mode
│   ├── use-color-scheme.web.ts      # 🌓 Versão web do hook
│   ├── use-theme-color.ts           # 🎨 Retorna cor baseada no tema
│   └── useFirestoreSync.ts          # 🔄 Sincroniza com Firestore
│                                    #    - Setup listeners
│                                    #    - Cleanup listeners
│                                    #    - Connection status
│
├── 🧩 components/                   # Componentes Reutilizáveis
│   ├── themed-text.tsx              # 📝 Texto com tema (light/dark)
│   ├── themed-view.tsx              # 📦 View com tema
│   ├── ui/
│   │   ├── collapsible.tsx          # 🔽 Componente colapsável
│   │   └── icon-symbol.tsx          # 🔱 Ícones dinâmicos
│   └── ... [outros helpers]
│
├── 🎨 constants/                    # Constantes do App
│   └── theme.ts                     # 🎨 Cores e temas
│
├── 🔧 services/                     # Serviços Externos
│   └── firebase/
│       └── config.ts                # 🔥 Inicialização Firebase
│
├── 📦 assets/                       # Recursos Estáticos
│   └── images/
│       ├── logo/logo.png            # 📌 Logo do app (usado em 4 telas)
│       ├── icon.png                 # 📌 App icon (app.json)
│       ├── android-icon-*.png       # 📌 Ícones Android
│       ├── splash-icon.png          # 📌 Splash screen
│       └── favicon.png              # 📌 Web favicon
│
├── 📚 Configuração Global
│   ├── package.json                 # 📦 Dependências (42 packages)
│   ├── tsconfig.json                # 💻 Config TypeScript
│   ├── app.json                     # 📱 Config Expo (nome, versão, etc)
│   ├── .env                         # 🔒 Variáveis de ambiente (git-ignored)
│   ├── firebase.json                # 🔥 Firebase CLI config
│   ├── firestore.rules              # 🛡️ Regras de segurança
│   └── babel.config.js              # 🔧 Babel config
│
└── 📖 Documentação
    ├── README.md                    # Guia inicial
    ├── ARCHITECTURE.md              # Esta arquitetura (antes)
    ├── arquitetura.md              # 📐 Arquitetura atual
    ├── feito.md                    # ✅ Histórico completo
    ├── futuro.md                   # 🚀 Roadmap futuro
    └── ... [outros docs]
```

---

## 🏗️ Fluxo de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                   USER INTERFACE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  SignIn      │  │  SignUp      │  │  Home                │  │
│  │  Screen      │──│  Screen      │──│  Screen              │  │
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
│         │  │ (Cards + Mesa) │              │                   │
│         │  └────────────────┘              │                   │
│         └──────┬───────────────────────────┘                   │
└────────────────┼────────────────────────────────────────────────┘
                 │
┌────────────────┼────────────────────────────────────────────────┐
│                │         STATE MANAGEMENT LAYER                │
│         ┌──────┴──────────┐                                     │
│         │ AuthUserContext │────→ Firebase Auth                  │
│         │ (useContext)    │     (signIn, signUp)                │
│         └────────┬────────┘                                     │
│                  │                                              │
│    ┌─────────────┴─────────┐                                    │
│    │  GameManager          │                                    │
│    │  ┌──────────────────┐ │                                    │
│    │  │ gameState        │ │                                    │
│    │  │ - players[]      │ │                                    │
│    │  │ - hands{}        │ │                                    │
│    │  │ - itemPool       │ │                                    │
│    │  │ - currentTurn    │ │                                    │
│    │  │ - isFinished     │ │                                    │
│    │  └──────────────────┘ │                                    │
│    │                        │                                    │
│    │ Methods:              │                                    │
│    │ - addPlayer()         │                                    │
│    │ - playCard()          │                                    │
│    │ - startTurn()         │                                    │
│    │ - endTurn()           │                                    │
│    │ - validateCardPlay()  │                                    │
│    │ - joinMidGame()       │                                    │
│    │                        │                                    │
│    │ Event Emitter:         │                                    │
│    │ - card_played         │                                    │
│    │ - turn_ended          │                                    │
│    │ - game_finished       │                                    │
│    └─────────────┬─────────┘                                    │
└─────────────────┼────────────────────────────────────────────────┘
                  │
┌─────────────────┼────────────────────────────────────────────────┐
│                 │    PERSISTENCE & INTEGRATIONS LAYER           │
│                 │                                               │
│         ┌───────┴────────────┐                                  │
│         │ FirestoreManager   │  ←→ Firestore Database          │
│         │ ┌────────────────┐ │                                  │
│         │ │createRoom()    │ │  Room creation & sync            │
│         │ │joinRoom()      │ │  Player join/leave             │
│         │ │playCard()      │ │  Card play persistence         │
│         │ │endTurn()       │ │  Turn completion & scoring     │
│         │ │listenToRoom() │ │  Real-time updates             │
│         │ └────────────────┘ │                                  │
│         │                     │                                  │
│         │ useFirestoreSync    │  React Hook para listeners      │
│         │ Hook                │                                  │
│         └────────────────────┘                                  │
│                                                                 │
│         ┌──────────────────────────────────────────────┐        │
│         │ WhatsAppBridge                              │        │
│         │ ┌────────────────────────────────────────┐ │        │
│         │ │ generateInviteLink()                 │ │        │
│         │ │ sendViaWhatsApp()                    │ │        │
│         │ │ validateInvite()                     │ │        │
│         │ │ Deep linking (festhausgame://)       │ │        │
│         │ └────────────────────────────────────────┘ │        │
│         └──────────────────────────────────────────────┘        │
│                                                                 │
│         ┌──────────────────────────────────────────────┐        │
│         │ Firebase Services                           │        │
│         │ ┌────────────────┐  ┌──────────────────┐   │        │
│         │ │ Firebase Auth  │  │ expo-secure-store   │   │        │
│         │ │ (Email, Google)│  │ (Encrypted Token) │   │        │
│         │ └────────────────┘  └──────────────────┘   │        │
│         └──────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  FIRESTORE DATABASE STRUCTURE                   │
│                                                                 │
│  rooms/{roomId}                                                 │
│  ├── roomType: 'waiting_room' | 'direct_invite'               │
│  ├── createdBy: userId                                         │
│  ├── status: 'looking_for_players' | 'in_progress' | 'finished'│
│  ├── players: [userId, userId, ...]                           │
│  ├── maxPlayers: 6                                             │
│  ├── createdAt: timestamp                                      │
│  │                                                               │
│  ├── players/{userId}     (subcollection)                      │
│  │  ├── name, email, phone                                    │
│  │  ├── score: number                                         │
│  │  ├── joinedAt: timestamp                                   │
│  │  └── isReady: boolean                                      │
│  │                                                               │
│  └── turns/{turnId}       (subcollection)                      │
│     ├── leaderId: userId                                      │
│     ├── round: number                                         │
│     ├── trumpCategory: string                                 │
│     ├── playedCards: {playerId: card}                         │
│     └── timestamp: timestamp                                  │
│                                                                 │
│  users/{userId}                                                 │
│  ├── name: string                                               │
│  ├── email: string                                              │
│  ├── phone: string                                              │
│  ├── createdAt: timestamp                                       │
│  └── stats: {totalGames, wins, losses}                         │
│                                                                 │
│  statistics/{userId}                                            │
│  ├── totalGames: number                                         │
│  ├── wins: number                                               │
│  ├── averageScore: number                                       │
│  └── lastPlayed: timestamp                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow - Como Tudo se Conecta

### **Quando um jogador joga uma carta:**
```
1. User toca card na UI
   ↓
2. Game Screen: handlePlayCard(cardId)
   ↓
3. GameManager.playCard(playerId, cardId)
   - Valida regras (Naipe → Trunfo → Livre)
   - Atualiza estado local
   - Emite evento 'card_played'
   ↓
4. FirestoreManager.playCard(roomId, turnId, cardData)
   - Escreve jogada no Firestore
   - Atualiza documento da turn
   ↓
5. Firestore listener (onSnapshot) detecta mudança
   ↓
6. Todos os outros clientes recebem update em tempo real
   ↓
7. UI re-renderiza automaticamente com nova jogada
```

### **Quando um novo jogador entra:**
```
1. Convite WhatsApp via deep link (festhausgame://room/xyz)
   ↓
2. App abre, _layout.tsx processa link
   ↓
3. Game Screen: handleDeepLink() → room encontrado
   ↓
4. FirestoreManager.joinRoom(roomId, playerId)
   - Adiciona player ao array de players
   - Cria subcollection players/{userId}
   ↓
5. Listener do host detecta novo player
   ↓
6. UI atualiza lista de players em tempo real
   ↓
7. Host pode iniciar jogo quando pronto
```

### **Quando jogo termina:**
```
1. GameManager.endGame() é chamado
   ↓
2. Calcula rankings finais
   ↓
3. FirestoreManager.finishGame() 
   - Marca room como 'finished'
   - Salva rankings
   - Atualiza stats do usuário
   ↓
4. Firestore statistcs/{userId} é atualizado
   ↓
5. Listener detecta fim do jogo
   ↓
6. UI mostra tela de resultados
```

---

## 🛡️ Segurança - Como Protegemos os Dados

### **Authentication Layer**
- Firebase Auth valida credentials
- Tokens assinados JWT
- Session criptografada com `expo-secure-store`

### **Firestore Security Rules**
- ✅ Apenas players convidados podem entrar em room
- ✅ Players só veem dados próprios
- ✅ Apenas room creator pode finalizar jogo
- ✅ Validação server-side de todas as jogadas
- ✅ Default: DENY-ALL (segurança por padrão)

---

## 📊 Performance & Escalabilidade

### **Otimizações Atuais**
- ✅ Lazy loading de componentes
- ✅ Memoized selectors com useCallback
- ✅ Real-time listeners eficientes (only subscribed data)
- ✅ Batch writes no Firestore

### **Suporta**
- ✅ 2-12 jogadores por sala
- ✅ Até 100 salas simultâneas
- ✅ Real-time sync sem lag perceptível

---

## 🚀 Próximas Otimizações

- ⏳ Cloud Functions para validação server-side
- ⏳ Redis cache para ranks/leaderboard
- ⏳ Service Workers para offline support
- ⏳ Image optimization para logos
