# 🔐 Guia de Troubleshooting - Google Sign-In

## ❌ Erro: "Runtime not ready: non-js exception"

Este erro ocorre quando o serviço nativo de autenticação do Google não está pronto quando você clica no botão de login.

## ✅ Solução 1: Usar Development Build (Recomendado)

O Expo Go pode ter limitações com módulos nativos. Crie um development build:

```bash
npx expo run:android
```

Este comando:
- ✅ Compila o app como uma build nativa no seu emulador
- ✅ Muito mais estável do que Expo Go
- ✅ Melhor para testar OAuth e Google Sign-In
- ✅ Pode demorar 5-15 minutos na primeira vez

**Passos:**
1. Conecte seu emulador ou dispositivo
2. Execute: `npx expo run:android`
3. Aguarde a compilação
4. O app abrirá automaticamente
5. Teste o Google Sign-In

## ✅ Solução 2: Verificar Configurações

### 📱 Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione projeto `max-rpg-d4423`
3. Vá para **APIs & Services** → **Credentials**
4. Verifique seu **OAuth 2.0 Client IDs**:

#### Android:
- Package Name: `com.festhausgame`
- SHA-1: `93:6C:C5:BE:22:E1:22:08:23:B6:3A:AC:5D:57:C8:CA:40:56:AB:E7`

#### Web:
- Certified domains: `localhost:19000` (dev) e `max-rpg-d4423.firebaseapp.com` (prod)

### 💾 Arquivo .env

Verifique se está correto:

```bash
# File: .env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=seu_web_client_id_aqui
EXPO_PUBLIC_GOOGLE_NATIVE_CLIENT_ID=seu_android_client_id_aqui
```

### 📋 File: app.json

```json
{
  "expo": {
    "scheme": "festhausgame",
    "android": {
      "package": "com.festhausgame"
    }
  }
}
```

## 🔍 Debug: Ler Logs Detalhados

O `LoginScreen.tsx` agora tem logs detalhados. Abra o console Metro e procure por:

```
📱 [LoginScreen] Configuração:
🔐 [LoginScreen] Iniciando fluxo de login com Google...
✅ [LoginScreen] Tokens recebidos:
❌ [LoginScreen] EXCEÇÃO NATIVA OU ERRO:
```

**Exemplos de erro:**
- ❌ `RuntimeException` → Serviço de auth não pronto
- ❌ `cancelled` → Usuário cancelou o login
- ❌ `invalid_request` → Client ID incorreto

## 🆘 Se Nada Funcionar

### Opção A: Limpar Cache Completo

```bash
cd c:\FestHausGame
npm run android -- --clear
```

### Opção B: Reset do Emulador

```bash
# Listar emuladores
emulator -list-avds

# Deletar dados do emulador
emulator -avd Pixel_4_API_28 -wipe-data
```

### Opção C: Usar EAS Build (Produção)

```bash
eas build --platform android --profile preview
```

Isto cria uma build de produção e a instala no seu dispositivo/emulador.

## 📊 Checklist de Configuração

- [ ] SHA-1 correto no Google Cloud (`93:6C:C5:BE:22:E1:22:08:23:B6:3A:AC:5D:57:C8:CA:40:56:AB:E7`)
- [ ] Client IDs no `.env`
- [ ] Credenciais Firebase ativas
- [ ] `WebBrowser.maybeCompleteAuthSession()` chamado antes do componente
- [ ] `makeRedirectUri()` gerando URI corretamente
- [ ] Emulador ou dispositivo conectado
- [ ] Tela de permissões do Google aparece

## 🎯 Fluxo Esperado (Sucesso)

1. App abre → Tela de Login
2. Clica em "ENTRAR COM GOOGLE"
3. Navegador abre com login do Google
4. Escolhe conta → Autoriza app
5. Volta ao app → Autenticado na Home

## 💬 Mensagens de Debug (Esperadas)

```
📱 [LoginScreen] Configuração:
   - Platform: android
   - Redirect URI: ...
   - Web Client ID: 833177196919-7dsgm...

🔐 [LoginScreen] Chamando promptAsync()...
✅ [LoginScreen] promptAsync() executado com sucesso
✅ [LoginScreen] Resposta de sucesso recebida
✅ [LoginScreen] Tokens recebidos:
🔐 [LoginScreen] Processando login com Google...
✅ [LoginScreen] Firebase auth bem-sucedido: ...
✅ [LoginScreen] Login bem-sucedido: seu.email@gmail.com
```

## 📞 Contato / Próximos Passos

Se o erro persistir:
1. Verifique Console Metro completamente
2. cole TODO o erro aqui
3. Vou debugar em tempo real

Boa sorte! 🚀
