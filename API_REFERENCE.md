# 🔍 Quick Reference - Fest Haus Game API

## Índice Rápido
1. [GameManager](#gamemanager)
2. [WhatsAppBridge](#whatsappbridge)
3. [AuthUserContext](#authusercontext)
4. [Game Flow](#game-flow)

---

## GameManager

Classe central para toda lógica de jogo.

### **Constructor**
```typescript
const gameManager = new GameManager(maxPlayers: number);
```

### **Métodos Principais**

#### **startGame(players: Player[])**
Inicia uma partida
```typescript
const players: Player[] = [
  { id: '1', name: 'João', email: 'joao@ex.com', phone: '(11) 9xxxx-xxxx', profileImage: null },
  { id: '2', name: 'Maria', email: 'maria@ex.com', phone: '(11) 9xxxx-xxxx', profileImage: null }
];

gameManager.startGame(players);
// Resultado: Pool criado, cartas distribuídas, primeiro turno iniciado
```

#### **playCard(playerId: string, cardId: string)**
Jogador joga uma carta
```typescript
// Validação automática de regras
const result = gameManager.playCard('player_1', 'card_123');
// Não precisa verificar - GameManager valida automaticamente
```

#### **joinMidGame(player: Player)**
Permite um jogador entrar no meio da partida
```typescript
gameManager.joinMidGame({
  id: 'p4',
  name: 'Pedro',
  email: 'pedro@ex.com',
  phone: '(11) 9xxxx-xxxx'
});
// Pedro recebe 5 cartas (ou menos se pool pequeno)
```

#### **validateCardPlay(playerId: string, cardId: string)**
Valida se uma jogada é legal
```typescript
const isValid = gameManager.validateCardPlay('player_1', 'card_123');
// Retorna: { isValid: true } ou { isValid: false, reason: 'Must follow suit' }
```

### **Event System**

```typescript
// Subscribe a eventos
gameManager.on('turn_started', (data) => {
  console.log(`Turno de ${data.leaderId} começou`);
});

gameManager.on('card_played', (data) => {
  console.log(`${data.playerId} jogou ${data.card.name}`);
});

gameManager.on('round_ended', (data) => {
  console.log(`${data.winnerId} venceu a rodada!`);
  console.log(`Placar:`, data.scores);
});

gameManager.on('game_finished', (data) => {
  console.log(`Jogo terminou! Ranking:`, data.rankings);
});

// Tipos válidos de eventos:
// 'player_joined' | 'player_left' | 'turn_started' | 
// 'card_played' | 'card_distributed' | 'turn_ended' | 
// 'round_ended' | 'game_finished' | 'mid_game_join'
```

### **Game State Access**

```typescript
const state = gameManager.gameState;

// Acessar dados
state.currentTurn.leaderId;           // String
state.currentTurn.round;              // Number
state.currentTurn.trumpCategory;      // 'espadas' | 'ouro' | 'copas' | 'paus'
state.players;                        // Player[]
state.hands;                          // Map<string, PlayerHand>
state.rankings;                       // Player[]
state.isGameFinished;                 // Boolean
```

---

## WhatsAppBridge

Gerencia convites e deep linking.

### **generateWhatsAppInvite()**
Creates um convite com link de WhatsApp
```typescript
const player = { id: 'p1', name: 'João', ... };

const invite = WhatsAppBridge.generateWhatsAppInvite(
  player,
  'room_ABC123',
  'waiting_room',
  6 // maxPlayers
);

// Retorna:
{
  roomId: 'room_ABC123',
  message: 'Opa! João te convidou...',
  deepLink: 'festhausgame://room/room_ABC123',
  whatsappUrl: 'whatsapp://send?text=...'
}
```

### **sendViaWhatsApp()**
Abre WhatsApp com mensagem pré-preenchida
```typescript
const invite = WhatsAppBridge.generateWhatsAppInvite(...);

try {
  await WhatsAppBridge.sendViaWhatsApp(invite);
  // WhatsApp abre automaticamente
} catch (error) {
  console.log('WhatsApp não instalado');
}
```

### **setupDeepLinkHandler()**
Configura listener para links do app
```typescript
// Em app/_layout.tsx (já feito!)
useEffect(() => {
  const unsubscribe = WhatsAppBridge.setupDeepLinkHandler(
    (roomId: string) => {
      // Usuário clicou no link - entrar na sala
      router.push({
        pathname: '/screens/Game/index',
        params: { roomId }
      });
    },
    () => {
      // Convite expirado ou inválido
      Alert.alert('Convite expirado', 'Peça um novo convite ao amigo');
    }
  );

  return () => unsubscribe();
}, []);
```

### **Exemplo Completo: Criar & Compartilhar Convite**

```typescript
// Em app/screens/Game/index.tsx

const handleShareInvite = async () => {
  try {
    const invite = WhatsAppBridge.generateWhatsAppInvite(
      user,
      roomId,
      'waiting_room',
      6
    );

    // Mostrar opções
    Alert.alert('Compartilhar Convite', 'Escolha:', [
      {
        text: 'WhatsApp',
        onPress: async () => {
          await WhatsAppBridge.sendViaWhatsApp(invite);
        }
      },
      {
        text: 'Copiar Link',
        onPress: async () => {
          await Clipboard.setStringAsync(invite.deepLink);
          Alert.alert('Link copiado!');
        }
      },
      { text: 'Cancelar', style: 'cancel' }
    ]);
  } catch (error) {
    console.error('Erro ao compartilhar:', error);
  }
};
```

---

## AuthUserContext

Gerencia autenticação e estado do usuário.

### **Login**
```typescript
const { signIn } = useContext(AuthUserContext);

try {
  await signIn('email@ex.com', 'senha123');
  // Usuário autenticado - Home screen aparece
} catch (error) {
  console.log(error.message);
}
```

### **Google Sign-in**
```typescript
const { signInWithGoogle } = useContext(AuthUserContext);

try {
  const user = await signInWithGoogle();
  console.log(`Bem-vindo ${user.name}!`);
} catch (error) {
  console.log('Google Sign-in falhou');
}
```

### **Signup**
```typescript
const { signUp } = useContext(AuthUserContext);

try {
  await signUp('João', 'joao@ex.com', 'senha123');
  // Usuário criado e logado automaticamente
} catch (error) {
  console.log(error.message);
}
```

### **Logout**
```typescript
const { signOut } = useContext(AuthUserContext);

const handleLogout = async () => {
  await signOut();
  // Volta para SignIn screen
};
```

### **Acessar Dados do Usuário**
```typescript
const { user, loading } = useContext(AuthUserContext);

if (loading) {
  return <Text>Loading...</Text>;
}

return (
  <View>
    <Text>{user.nome}</Text>
    <Text>{user.email}</Text>
  </View>
);
```

---

## Game Flow

### **Fluxo Completo de Uma Partida**

```typescript
// 1. CREATE ROOM
const roomId = generateUUID();
const gameManager = new GameManager(6); // Max 6 players

// 2. ADD PLAYERS (antes de iniciar)
const player1: Player = {
  id: 'p1',
  name: 'João',
  email: 'joao@ex.com',
  phone: '(11) 9xxxx-xxxx'
};

gameManager.addPlayer(player1);

// 3. GENERATE INVITE (para compartilhar)
const invite = WhatsAppBridge.generateWhatsAppInvite(
  player1,
  roomId,
  'waiting_room'
);
// Mensagem com link para outros players

// 4. OTHER PLAYERS JOIN (clicam no link)
const player2: Player = { ... }; // Clicar link → chega aqui
gameManager.addPlayer(player2);

// 5. RECEIVE EVENTS
gameManager.on('player_joined', (data) => {
  setPlayers([...players, data.player]);
});

// 6. START GAME (host confirma)
gameManager.startGame([player1, player2, ...]);

gameManager.on('turn_started', (data) => {
  // Mostra que é a vez de alguém
  setCurrentLeader(data.leaderId);
});

// 7. PLAY CARDS (durante o jogo)
gameManager.playCard('p1', 'card_123'); // Jogar primeira carta
gameManager.playCard('p2', 'card_456'); // Jogar segunda

// 8. END TURN (sistema calcula)
gameManager.endTurn();

gameManager.on('round_ended', (data) => {
  console.log(`${data.winnerId} venceu!`);
  // UI atualiza com vencedor
});

// 9. NEXT ROUND (automático)
// Turn inicia novamente com novo líder

// 10. GAME FINISHED
gameManager.on('game_finished', (data) => {
  console.log('Rankings finais:', data.rankings);
  // Mostrar resultados
});
```

---

## Type Definitions

### **Item (Card)**
```typescript
interface Item {
  id: string;           // "espadas_1"
  name: string;         // "Ás de Espadas"
  category: ItemCategory; // "espadas" | "ouro" | "copas" | "paus"
  value: number;        // 1-12 (maior = melhor)
  rarity: ItemRarity;   // "comum" | "raro" | "épico" | "lendário"
  isTrump?: boolean;    // Se é trunfo da rodada
}
```

### **Player**
```typescript
interface Player {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
}
```

### **GameState**
```typescript
interface GameState {
  roomId: string;
  players: Player[];
  hands: Map<string, PlayerHand>;
  currentTurn: Turn;
  rankings: Player[];
  itemPool: Item[];
  isGameFinished: boolean;
  maxPlayers: number;
}
```

---

## Constants

### **Item Categories**
```typescript
type ItemCategory = 'espadas' | 'ouro' | 'copas' | 'paus';
// Espadas (♠), Ouro (♦), Copas (♥), Paus (♣)
```

### **Item Rarity**
```typescript
type ItemRarity = 'comum' | 'raro' | 'épico' | 'lendário';
// Distri buição: 50% comum, 30% raro, 15% épico, 5% lendário
```

### **Room Types**
```typescript
type RoomType = 'waiting_room' | 'direct_invite';
// waiting_room: Jogadores entram até começar
// direct_invite: Só jogadores convidados
```

---

## Debugging Tips

### **Ver Logs do Game**
```typescript
// Em GameManager.ts - descomente para debug
console.log('Pool:', this.gameState.itemPool);
console.log('Players:', this.gameState.players);
console.log('Current hand:', this.gameState.hands.get(playerId));
```

### **Simulador Local**
```typescript
// Testar lógica sem Firestore
const gm = new GameManager(6);
const p1 = { id: '1', name: 'Test1', email: 'test1@ex.com', phone: '11999999999' };
const p2 = { id: '2', name: 'Test2', email: 'test2@ex.com', phone: '11999999999' };

gm.addPlayer(p1);
gm.addPlayer(p2);
gm.startGame([p1, p2]);

// Simular jogadas
gm.playCard('1', gm.gameState.hands.get('1').items[0].id);
gm.playCard('2', gm.gameState.hands.get('2').items[0].id);
gm.endTurn();
```

---

## Common Patterns

### **Padrão: Guardar Estado em useState**
```typescript
const [gameState, setGameState] = useState<GameState>(null);
const [gameManager] = useState(() => new GameManager(6));

useEffect(() => {
  // Listener para atualizações
  gameManager.on('turn_started', (data) => {
    setGameState(gameManager.gameState);
  });

  gameManager.on('card_played', (data) => {
    setGameState(gameManager.gameState);
  });
}, []);
```

### **Padrão: Validar Antes de Jogar**
```typescript
const handleCardPress = (cardId: string) => {
  const validation = gameManager.validateCardPlay(userId, cardId);
  
  if (!validation.isValid) {
    Alert.alert('Jogada Inválida', validation.reason);
    return;
  }

  gameManager.playCard(userId, cardId);
};
```

### **Padrão: Auto-cleanup**
```typescript
useEffect(() => {
  // Setup
  const unsubscribe = gameManager.on('game_finished', handleGameEnd);

  // Cleanup
  return () => unsubscribe();
}, []);
```

---

## Erros Comuns

| Erro | Causa | Solução |
|------|-------|--------|
| "Card not found in hand" | Card ID errado | Verificar IDs das cartas |
| "Must follow suit" | Validação de naipe | Jogar carta do naipe correto |
| "Trump not found" | Jogo de trunfo vazio | Validação, outro não tinha trunfo |
| "Deep link invalid" | Convite expirado | Pedir novo convite |
| "WhatsApp not installed" | App não baixado | Fallback para WhatsApp Web |

---

**Para mais detalhes, ver:**
- `DEVELOPMENT_STATUS.md` - Arquitetura
- `CONTINUATION_GUIDE.md` - Próximas features
- Código-fonte com comentários JSDoc
