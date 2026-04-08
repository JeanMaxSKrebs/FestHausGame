# Fest Haus Game

Um novo projeto React Native baseado no Projeto_termax com autenticação Firebase e telas de login/cadastro.

## 📋 Requisitos

- Node.js >= 16
- React Native CLI
- Firebase project (para autenticação)
- Android SDK (para Android)
- Xcode (para iOS)

## 🚀 Primeiros Passos

### 1. Instalar Dependências

```bash
npm install
```

ou

```bash
yarn install
```

### 2. Configurar Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Configure a autenticação por Email/Senha
3. Baixe o arquivo `google-services.json` para Android
4. Baixe o arquivo `GoogleService-Info.plist` para iOS

#### Android:
Coloque `google-services.json` em `android/app/`

#### iOS:
Coloque `GoogleService-Info.plist` no projeto Xcode

### 3. Configurar Autenticação Google

#### Android:
1. Gere o SHA-1 da sua chave:
```bash
cd android
./gradlew signingReport
```

2. Adicione o SHA-1 ao Firebase Console

3. Configure OAuth 2.0 no [Google Cloud Console](https://console.cloud.google.com)

#### iOS:
1. Configure URL Schemes no Xcode:
   - Bundle ID debe estar configurado no Firebase
   - Adicione o arquivo `GoogleService-Info.plist`

### 4. Executar o Projeto

#### Android:
```bash
npm run android
```

#### iOS:
```bash
npm run ios
```

#### Desenvolvimento:
```bash
npm start
```

## 📁 Estrutura do Projeto

```
src/
├── screens/
│   ├── SignIn/       # Tela de login
│   ├── SignUp/       # Tela de cadastro
│   └── Home/         # Tela inicial
├── context/
│   └── AuthUserProvider.js  # Contexto de autenticação
├── navigation/
│   └── Navigator.js  # Navegação do app
└── components/
```

## 🔐 Autenticação

O projeto utiliza Firebase Authentication com:
- Email/Senha
- Suporte para Google Sign-In (a ser implementado)

### AuthUserContext

O contexto fornece os seguintes métodos:

```javascript
{
  user,           // Usuário atual
  loading,        // Status de carregamento
  signIn,         // Login com email/senha
  signUp,         // Criar nova conta
  signOut,        // Fazer logout
  getUserData,    // Obter dados do usuário
  storeUserSession // Armazenar sessão criptografada
}
```

## 🔄 Fluxo de Autenticação

1. **Inicialização**: O app tenta recuperar a sessão criptografada
2. **Login**: Usuário faz login com email e senha
3. **Sessão**: Credenciais são armazenadas criptografadas
4. **Logout**: A sessão é limpa e o usuário volta para SignIn

## 📦 Dependências Principais

- `@react-native-firebase/*`: Autenticação e Firestore
- `@react-navigation/*`: Navegação
- `react-native-encrypted-storage`: Armazenamento seguro
- `styled-components`: Estilo de componentes

## 🛠️ Scripts Disponíveis

- `npm start`: Inicia o metro bundler
- `npm run android`: Executa no Android
- `npm run ios`: Executa no iOS
- `npm test`: Rodas testes
- `npm run lint`: Verifica lint

## 📝 Próximos Passos

- [ ] Implementar Google Sign-In
- [ ] Adicionar componentes customizados
- [ ] Implementar telas de jogo
- [ ] Adicionar sistema de pontos/moedas
- [ ] Integrar Firestore para dados

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação oficial:
- [React Native](https://reactnative.dev/)
- [Firebase](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)

---

Desenvolvido basead no Projeto_termax
