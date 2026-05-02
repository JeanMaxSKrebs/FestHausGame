# 🔥 Firestore Setup Guide

## Passo 1: Criar Firestore Database no Firebase Console

1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto (`festhaus-game`)
3. No menu lateral, clique em **Firestore Database** (sob "Build")
4. Clique em **Create Database**
5. Escolha:
   - **Localização:** `us-central1` (padrão)
   - **Modo:** `Start in test mode` (para desenvolvimento)
   - Clique **Create**

**⚠️ Importante:** Você terá acessar com as regras de segurança depois!

---

## Passo 2: Deploy das Security Rules

Depois que o Firestore estiver criado, you need to deploy the security rules:

### Opção A: Via Firebase CLI (Recomendado)

```bash
# Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

### Opção B: Manual via Console

1. Firebase Console > Firestore Database
2. Abra a aba **Rules**
3. Copie o conteúdo de `firestore.rules`
4. Cole na editor no console
5. Clique **Publish**

---

## Passo 3: Criar Índices (Se Necessário)

Firestore vai sugerir criar índices automaticamente quando você fizer queries complexas.

Para esta aplicação, você pode pré-criar índices:

1. Firebase Console > Firestore Database > Indexes
2. Clique **Create Index**

**Index 1:**
- Collection: `rooms`
- Fields: `status` (Ascending), `createdAt` (Descending)

---

## Passo 4: Verificar Collection Structure

Firestore vai criar as collections automaticamente quando você fizer o primeiro write:

```
firestore
├── rooms/
│   ├── room_1712700000000/
│   │   ├── roomId: string
│   │   ├── roomType: string
│   │   ├── createdBy: string
│   │   ├── createdAt: timestamp
│   │   ├── status: string
│   │   ├── maxPlayers: number
│   │   ├── players: array
│   │   └── gameState: object
│   │
│   └── players/
│       └── userId/
│           ├── userId: string
│           ├── name: string
│           ├── email: string
│           ├── phone: string
│           ├── joinedAt: timestamp
│           ├── score: number
│           └── isReady: boolean
│
├── users/
│   └── userId/
│       ├── name: string
│       ├── email: string
│       ├── phone: string
│       ├── createdAt: timestamp
│       └── stats: object
│
└── statistics/
    └── userId/
        ├── totalGames: number
        ├── wins: number
        ├── losses: number
        └── averageScore: number
```

---

## Passo 5: Testar Connection

Para testar se a conexão com Firestore está funcionando:

```bash
# Terminal 1: Emulator Firestore (opcional)
firebase emulators:start

# Terminal 2: Start app
npm start
```

Quando criar uma sala, você deve ver:
```
✅ Room criada no Firestore: room_1712700000000
👂 Escutando mudanças na sala: room_1712700000000
```

---

## Passo 6: Environment Variables

Adicione ao seu `.env`:

```env
# Firebase (já deve estar)
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

# Firestore (opcional - já configurado automaticamente)
EXPO_PUBLIC_FIRESTORE_REGION=us-central1
```

---

## Troubleshooting

### ❌ "Permission denied" ao criar room

**Problema:** Rules não foram deployados corretamente

**Solução:**
1. Verifique se `.rules` está correto
2. Deploy novamente:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. Aguarde ~1 minuto para propagação

### ❌ "Collection not found"

**Problema:** Você está tentando ler coleção que ainda não existe

**Solução:** Crie a collection fazendo o primeiro write (ao criar uma sala)

### ❌ "Field playedCards is not a map"

**Problema:** Tipo de dados incorreto no Firestore

**Solução:** Verifique se está usando objeto `{}` e não array `[]`

---

## Comandos Úteis

```bash
# Ver logs do Firestore
firebase functions:log

# Deletar collection (cuidado!)
firebase firestore:delete rooms --recursive --auto

# Backup Firestore
firebase firestore:export backup/

# Restore Firestore
firebase firestore:import backup/
```

---

## Próximos Passos

Depois de configurar Firestore:

1. ✅ Deploy Firestore Rules
2. ⏳ Implementar Cloud Functions para validação server-side
3. ⏳ Configurar autoscaling se em produção
4. ⏳ Monitorar dados de uso (Firebase Console)

---

## Referências

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI](https://firebase.google.com/docs/cli)

---

**Status:** ✅ Configuração pronta para deploy
