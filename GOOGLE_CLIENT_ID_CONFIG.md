# Configuração do Google Sign-In - FestHaus Game

## ✅ Status da Configuração

Seu Web Client ID já foi configurado no arquivo `.env`:
```
GOOGLE_WEB_CLIENT_ID=833177196919-7dsgmk3vm2vssbfg320dpf1jd5o9l8ks.apps.googleusercontent.com
```

## 🔧 Como foi configurado

### Variáveis de Ambiente (.env)
- ✅ Arquivo `.env` criado com `GOOGLE_WEB_CLIENT_ID`
- ✅ Arquivo `.env.example` criado como template
- ✅ Já presente no `.gitignore` para segurança

### Integração com Babel
- ✅ Instalado `react-native-dotenv` no `package.json`
- ✅ Configurado `babel.config.js` para ler variáveis de `.env`

### Código Atualizado
- ✅ `AuthUserProvider.js` importa `GOOGLE_WEB_CLIENT_ID` de `@env`
- ✅ GoogleSignin.configure() usa a variável de ambiente

## 📋 Próximas Ações

### 1. Firebase Console - Ativar Google Sign-In

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto FestHaus Game
3. Vá para **Authentication** > **Sign-in method**
4. Clique em **Google**
5. Cole seu Web Client ID (ou deixe em branco para gerar automaticamente)
6. Clique em **Salvar**

### 2. Android - Adicionar SHA-1

No Firebase Console:
1. Vá para **Project Settings** (engrenagem no topo)
2. Selecione a aba **Apps**
3. Clique em seu app Android
4. Em **SHA certificate fingerprints**, clique em **Add fingerprint**
5. Execute no terminal do projeto:
   ```bash
   cd android
   ./gradlew signingReport
   ```
6. Copie o SHA-1 e cole no Firebase

### 3. iOS - Configurar URL Scheme

1. No Xcode, abra `ios/FestHausGame.xcodeproj`
2. Selecione o projeto e a aba **Info**
3. Clique em **URL Types**
4. Clique em **+** para adicionar um novo
5. Cole seu URL Scheme: `com.googleusercontent.apps.833177196919-7dsgmk3vm2vssbfg320dpf1jd5o9l8ks`

### 4. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 5. Compilar e Testar

```bash
# Android
npm run android

# iOS
npm run ios
```

## ✨ Funcionalidades Implementadas

- ✅ Botão **ENTRAR COM GOOGLE** na tela de login
- ✅ Botão **CADASTRAR COM GOOGLE** na tela de cadastro
- ✅ Login com Google integrado ao Firebase Auth
- ✅ Dados do usuário salvos no Firestore
- ✅ Logout com revogação de acesso Google

## 🔒 Segurança

- `.env` está no `.gitignore` para não ser commitado
- Chaves sensíveis não ficam no código
- Use `.env.example` como template para novos ambientes

## 📝 Variáveis de Ambiente Disponíveis

```
GOOGLE_WEB_CLIENT_ID=seu_web_client_id.apps.googleusercontent.com
```

Você pode adicionar mais variáveis conforme necessário (ex: Firebase API keys).
