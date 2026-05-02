# � Setup Android - Passo a Passo

## ✅ Projeto já configurado para Android

- ✅ Firebase: Produção (sem emuladores)
- ✅ Android: Pronto para build
- ✅ Code: Limpo e funcional
- ⏸️ iOS: Será criado no futuro

---

## Step 1️⃣: Firebase Console - Criar App Android

### 1. Acessar Firebase

1. Ir para: https://console.firebase.google.com
2. Projeto: **max-rpg-d4423 (FestHausGame)**
3. Settings ⚙️ → **Project Settings**

### 2. Remover App Antigo (se existir)

1. Descer até **"Your apps"**
2. Procurar por app Android antigo
3. Clicar 3 pontos (...) → **Delete**
4. Confirmar

### 3. Criar Novo App Android

1. Clicar **+ Add app** → **Android**
2. Preencher:
   - **Package name**: `com.festhausgame`
   - **App nickname**: FestHausGame (ou deixar padrão)
   - **Debug SHA-1**: (deixar em branco por enquanto - opcional)
3. Clicar **Register app**

### 4. Download google-services.json

1. Após registrar, vai aparecer: **"Download google-services.json"**
2. **CLIQUE** e faça download
3. **IMPORTANT**: Salvar em:
   ```
   android/app/google-services.json
   ```
4. Depois clicar **Next** → **Next** → Done

---

## Step 2️⃣: Configurar .env

Seu `.env` já tem as credenciais. Garantir que tem:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=xxxxxxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=max-rpg-d4423.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=max-rpg-d4423
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=max-rpg-d4423.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxxxxxx
```

---

## Step 3️⃣: Testar no Android

### Você precisa de:
- ✅ Android Studio (com emulador ou dispositivo USB)
- ✅ `google-services.json` em `android/app/`
- ✅ `.env` com credenciais Firebase

### Então rodar:

```bash
npm run android
```

**Isso vai:**
1. Compilar a aplicação
2. Instalar no emulador/dispositivo
3. Abrir app automaticamente

---

## 💡 Se der erro...

### "google-services.json not found"
- Verificar se arquivo está em `android/app/google-services.json`
- Não deve estar em `android/` ou `C:/FestHausGame/`

### "Android SDK not found"
- Instalar Android Studio: https://developer.android.com/studio
- Configurar paths corretamente

### "Emulator not detected"
- Abrir Android Studio
- AVD Manager → Criar/ligar emulador
- Ou conectar dispositivo USB

### "Firebase authentication error"
- Verificar `.env` tem credenciais REAIS do Firebase
- Verificar `google-services.json` está correto (do Firebase Console)

---

## 🎯 Fluxo Resumido

```bash
# 1. Download google-services.json do Firebase
#    → Salvar em: android/app/google-services.json

# 2. Ligar emulador Android ou conectar dispositivo

# 3. Rodar:
npm run android

# 4. Pronto! App deve abrir no emulador/dispositivo
```

---

## 📱 Testando a App

- ✅ Tela inicial deve carregar
- ✅ Login com Email/Senha
- ✅ Sign-up novo usuário
- ✅ Logout
- ✅ Google Sign-in (se tiver domínio autorizado)

---

## 🔄 iOS (Futuro)

Quando criar a pasta `ios/`:

1. Mesmo processo no Firebase Console
2. Download `GoogleService-Info.plist`
3. Salvar em `ios/GoogleService-Info.plist`
4. Abrir Xcode e drag-drop o arquivo
5. Rodar `npm run ios`

---

**Seu app está pronto para Android!** 🎉

