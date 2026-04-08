# Fest Haus Game - Guia de Configuração Google Sign-In

## 📋 Configuração do Google Sign-In

### Passo 1: Instalar Dependências

```bash
npm install @react-native-google-signin/google-signin react-native-vector-icons
```

### Passo 2: Configurar Android

#### 2.1 Adicionar Dependências (android/build.gradle)

```gradle
allprojects {
    repositories {
        // ...
        maven {
            url 'https://maven.google.com'
        }
    }
}
```

#### 2.2 Configurar android/app/build.gradle

```gradle
dependencies {
    // ...
    implementation 'com.google.android.gms:play-services-auth:20.5.0'
    implementation 'com.google.firebase:firebase-auth'
}
```

### Passo 3: Configurar iOS

#### 3.1 Executar Pod Install

```bash
cd ios
pod install
```

#### 3.2 URL Schemes no Xcode

1. Abra o projeto Xcode: `open ios/FestHausGame.xcworkspace`
2. Vá para: Target > Info > URL Types
3. Adicione URL Scheme: `com.googleusercontent.apps.YOUR_CLIENT_ID`

### Passo 4: Utilizar Google Sign-In no App

```javascript
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

// Configure o Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

// Função para fazer login com Google
const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    const credential = auth.GoogleAuthProvider.credential(userInfo.idToken);
    await auth().signInWithCredential(credential);
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('Usuário cancelou o login');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('Login em progresso');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('Play Services não disponível');
    } else {
      console.error(error);
    }
  }
};
```

### Passo 5: Firebase Console

1. Ative Google Sign-In em: Firebase Console > Authentication > Sign-in method
2. Adicione o SHA-1 do seu projeto Android
3. Configure OAuth 2.0 no Google Cloud Console

## 🔗 Referências

- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Firebase Google Authentication](https://firebase.google.com/docs/auth/android/google-signin)

---

**Nota**: Você precisa substituir `YOUR_CLIENT_ID` e `YOUR_WEB_CLIENT_ID` pelos valores reais do seu projeto Firebase.
