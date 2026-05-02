# 🔐 Configurar Google Sign-In com Expo

## Passos para Habilitar Google Sign-In

### 1️⃣ Obter Google OAuth Client ID

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto Firebase (max-rpg-d4423)
3. Vá para **APIs & Services** → **Credentials**
4. Clique em **Create Credentials** → **OAuth Client ID**
5. Escolha **Web application** (NÃO Android)
6. Nome: `FestHausGame Web`

#### Configurar Redirect URIs
7. Em **Authorized redirect URIs**, adicione:
   - `https://auth.expo.io/@seu_usuario/FestHausGame`
   - `com.festhausgame://` (custom scheme)
   - `exp://localhost:19000/*` (local development)

8. Clique em **CREATE**
9. Copie o **Client ID** (não o secret!)

### 2️⃣ Criar arquivo `.env` local

```bash
# Copiar do .env.example
cp .env.example .env

# Editar .env e adicionar seu Client ID
EXPO_PUBLIC_GOOGLE_CLIENT_ID=seu_client_id_aqui
```

### 3️⃣ Testar Local

```bash
npm run android -- --port 8082
```

Clique em "ENTRAR COM GOOGLE" e você verá:
- ✅ Navegador abre com login do Google
- ✅ Após login, código de autenticação é recebido
- ✅ Mensagem mostrando próximos passos

### 4️⃣ (Opcional) Completar Backend para Produção

Para funcionar completamente em produção, precisamos de um backend que:

1. Receba o código de autenticação do cliente
2. Troque o código por um Token ID do Google (usando client secret)
3. Retorne o token ao cliente
4. Cliente usa o token para autenticar no Firebase

**Exemplo com Node.js:**

```javascript
// backend/routes/google-auth.js
const axios = require('axios');

app.post('/api/auth/google', async (req, res) => {
  const { code, redirectUri } = req.body;
  
  try {
    // Trocar código por token
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET, // ⚠️ NUNCA compartilhar!
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    
    // Token ID está em response.data.id_token
    res.json({ idToken: response.data.id_token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

Então no cliente:

```javascript
// Após obter código:
const response = await fetch('https://seu-backend.com/api/auth/google', {
  method: 'POST',
  body: JSON.stringify({ code, redirectUri })
});

const { idToken } = await response.json();

// Usar no Firebase
const credential = GoogleAuthProvider.credential(idToken);
await signInWithCredential(auth, credential);
```

## Status Atual

- ✅ Google Sign-In via Expo funciona localmente
- ⏳ Backend necessário para produção
- ✅ Email/Senha função 100%

## Solução Alternativa Simples

Se não quiser fazer backend, use **Firebase**:
- Google já configurado no Firebase Console
- Use `signInWithPopup` em Web
- Use `@react-native-google-signin/google-signin` com EAS Build Android

Qual você prefere?
