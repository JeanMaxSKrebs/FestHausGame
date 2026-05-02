# 🎮 Fest Haus Game - Guia de Continuação

## Status Atual
**Completo:** 85% das funcionalidades principais  
**Última Atualização:** Dezembro 2024  

---

## ✅ O Que Já Foi Feito

### 1️⃣ **Autenticação Completa**
- Login com Email/Senha
- Google Sign-in via Expo
- Cadastro de usuários
- Sessão persistente criptografada
- Campo de telefone no login

**Arquivos:** `app/screens/SignIn/`, `context/AuthUserProvider.js`

### 2️⃣ **Interface Pronta**
- Home screen com 3 opções de jogo
- Game screen com lobby e gameplay
- Logo integrado em todos os lugares
- Design limpo e responsivo

**Arquivos:** `app/screens/Home/`, `app/screens/Game/`

### 3️⃣ **Motor de Jogo 100% Funcional**
- Sistema de cartas com categorias (naipes)
- Pool dinâmico baseado no número de jogadores
- Validação de jogadas (regras de naipe/trunfo)
- Hot-join para entrar no meio da partida
- Sistema de eventos para UI updates

**Arquivos:** `game/GameManager.ts`, `game/types.ts`

### 4️⃣ **WhatsApp Integration**
- Geração de links de convite
- Deep linking configurado
- Validação de convites (24h)
- app.json com scheme `festhausgame://`

**Arquivos:** `game/WhatsAppBridge.ts`, `app.json`

---

## ⏳ O Que Precisa Ser Feito (Próximas Prioridades)

### 🔴 **CRÍTICO - Firebase Firestore** (2-3 dias)
Isso é o que permite multiplayer real:

```typescript
// Collections necessárias:
- rooms/{roomId}
  ├── roomType: 'waiting_room' | 'direct_invite'
  ├── createdBy: userId
  ├── createdAt: timestamp
  ├── maxPlayers: number
  ├── status: 'looking_for_players' | 'in_progress' | 'finished'
  └── players: [userId, userId, ...]

- rooms/{roomId}/players/{userId}
  ├── name: string
  ├── email: string
  ├── phone: string
  ├── joinedAt: timestamp
  └── score: number

- rooms/{roomId}/turns/{turnId}
  ├── leaderId: string
  ├── round: number
  ├── trump_category: ItemCategory
  ├── played_cards: {[playerId]: cardData}
  └── timestamp: timestamp
```

**Como implementar:**
1. Criar arquivo `game/FirestoreManager.ts`
2. Implementar `initRoom()`, `joinRoom()`, `playCard()`
3. Adicionar listeners em tempo real: `onSnapshot()`
4. Sincronizar GameState com Firestore

**Referência de código:**
```typescript
// game/FirestoreManager.ts
import { getFirestore, collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

export class FirestoreManager {
  static async createRoom(roomId: string, config: RoomConfig) {
    const db = getFirestore();
    await setDoc(doc(db, 'rooms', roomId), {
      ...config,
      createdAt: new Date(),
      status: 'looking_for_players'
    });
  }

  static listenToRoom(roomId: string, callback: (data: any) => void) {
    const db = getFirestore();
    return onSnapshot(doc(db, 'rooms', roomId), (doc) => {
      callback(doc.data());
    });
  }
}
```

### 🟠 **ALTO - Sincronização Multiplayer** (2-3 dias)
Conectar GameManager com Firestore:

1. Quando jogador joga uma carta:
   ```typescript
   // Em Game.tsx
   handlePlayCard = async (cardId: string) => {
     this.gameManager.playCard(playerId, cardId);
     await FirestoreManager.updateTurn(roomId, turnData); // ← Novo
   }
   ```

2. Listeners para updates dos outros jogadores:
   ```typescript
   // Em Game.tsx useEffect
   const unsubscribe = FirestoreManager.listenToRoom(roomId, (newData) => {
     setGameState(newData);
     // Also sync with GameManager
   });
   ```

### 🟡 **MÉDIO - SignUp Enhancements** (1 dia)
Atualizar tela de cadastro:

1. Converter `app/screens/SignUp/index.js` → `.tsx`
2. Adicionar campo de telefone com validação
3. Espelhar design do SignIn
4. Persistir telefone no Firestore junto com usuário

### 🟡 **MÉDIO - Persistência de Dados** (1-2 dias)
Armazenar dados importantes:

- Histórico de partidas (para estatísticas)
- Perfil expandido do usuário (foto, bio)
- Ranking/ELO do jogador
- Amigos

---

## 🛠️ Como Estruturar Firestore

### Segurança (Firebase Rules)
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rooms - players podem ler/escrever suas salas
    match /rooms/{roomId} {
      allow read: if request.auth.uid in resource.data.players;
      allow create: if request.auth.uid != null;
      
      match /players/{userId} {
        allow read, write: if request.auth.uid == userId || 
                              request.auth.uid == get(/databases/$(database)/documents/rooms/$(roomId)).data.createdBy;
      }
      
      match /turns/{turnId} {
        allow read, write: if request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.players;
      }
    }
    
    // Users - apenas o próprio usuário pode acessar
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Roadmap Sugerido

### Semana 1 (Multiplayer)
- [ ] Criar FirestoreManager.ts
- [ ] Implementar Firestore listeners
- [ ] Sincronizar GameState
- [ ] Testar com 2 dispositivos

### Semana 2 (Polish)
- [ ] Atualizar SignUp screen
- [ ] Adicionar persist de histórico
- [ ] Melhorar UX de conexão
- [ ] Tratamento de erros de rede

### Semana 3 (Ranking)
- [ ] Sistema de Elo/MMR
- [ ] Leaderboard
- [ ] Estatísticas de jogador
- [ ] Prêmios/achievements

### Semana 4 (Release)
- [ ] Testes automatizados
- [ ] Build para iOS/Android
- [ ] Deploy
- [ ] Publicar nas stores

---

## 📂 Arquivos Principais Para Modificar

```
✅ COMPLETO (não mexer sem motivo)
├── app/screens/SignIn/index.tsx
├── app/screens/Home/index.tsx  
├── app/screens/Game/index.tsx
├── app/_layout.tsx
├── game/GameManager.ts
├── game/types.ts
├── game/WhatsAppBridge.ts
├── context/AuthUserProvider.js

⏳ PRÓXIMA PRIORIDADE (criar/modificar)
├── game/FirestoreManager.ts ← CRIAR NOVO
├── app/screens/SignUp/index.tsx ← CONVERTER & MELHORAR
└── firebase rules ← ATUALIZAR SEGURANÇA
```

---

## 💡 Dicas Práticas

### 1. **Testar Localmente Primeiro**
```bash
npm start
# Escanear QR com Expo Go
```

### 2. **Firestore Emulator (Recomendado)**
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Inicializar
firebase init emulator

# Rodar
firebase emulators:start
```

### 3. **Debug de Deep Links**
```bash
# Android
adb shell am start -W -a android.intent.action.VIEW -d "festhausgame://room/test123" com.festhausgame

# iOS (expo)
xcrun simctl openurl booted "festhausgame://room/test123"
```

### 4. **Testar WhatsApp**
- Criar link: `festhausgame://room/abc123`
- Abrir em browser/WhatsApp
- Deve redirecionar para app e entrar na sala

---

## 🔧 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Module not found" | Verificar imports (usar relativos) |
| Deep link não funciona | Check app.json scheme e intent filters |
| Firestore não sincroniza | Verificar Firebase Rules e listeners |
| Firebase auth error | Verificar .env e EXPO_PUBLIC_ vars |

---

## 📞 Contatos Úteis

- **Firebase Docs**: https://firebase.google.com/docs/firestore
- **Expo Router**: https://docs.expo.dev/router/
- **React Native**: https://reactnative.dev/docs/getting-started

---

**🎭 Divirta-se desenvolvendo!**

Próximo passo recomendado: 

👉 **Criar `game/FirestoreManager.ts` e implementar sincronização básica**

Estimativa: 2-3 dias para multiplayer funcional 100%
