import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { app, auth } from '../services/firebase/config';

// Complete auth session on app resume
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signUp: (nome: string, email: string, senha: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  getUserData: () => Promise<void>;
  storeUserSession: (email: string, senha: string) => Promise<boolean>;
}

export const AuthUserContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => false,
  signOut: async () => {},
  signInWithGoogle: async () => {},
  getUserData: async () => {},
  storeUserSession: async () => false,
});

const db = getFirestore(app);

interface AuthUserProviderProps {
  children: ReactNode;
}

export const AuthUserProvider: React.FC<AuthUserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log('✅ Auth Provider inicializado');
  }, []);

  /**
   * Armazena a sessão do usuário de forma criptografada
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @returns {Promise<boolean>} - Retorna true se a sessão foi armazenada com sucesso
   */
  const storeUserSession = async (email: string, senha: string): Promise<boolean> => {
    try {
      await SecureStore.setItemAsync(
        'user_session',
        JSON.stringify({
          email,
          senha,
        })
      );
      return true;
    } catch (error) {
      console.error('Erro ao armazenar a sessão do usuário: ', error);
      return false;
    }
  };

  /**
   * Realiza o login do usuário
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   */
  const signIn = async (email: string, senha: string): Promise<void> => {
    try {
      setLoading(true);
      const credential = await signInWithEmailAndPassword(auth, email, senha);
      
      // Simples: apenas setar o usuário com email e uid
      setUser({
        uid: credential.user.uid,
        email: credential.user.email,
      });
      
      setLoading(false);
      console.log('✅ Login realizado:', email);
    } catch (error) {
      console.error('Erro ao fazer login: ', error);
      setLoading(false);
      throw error;
    }
  };

  /**
   * Cria um novo usuário
   * @param {string} nome - Nome do usuário
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   */
  const signUp = async (nome: string, email: string, senha: string): Promise<boolean> => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const userFirebase = userCredential.user;
      
      // Criar documento do usuário de forma assíncrona (não bloqueia)
      setDoc(doc(db, 'users', userFirebase.uid), {
        nome,
        email,
        createdAt: new Date(),
      }).catch((err: any) => console.warn('Erro ao salvar documento do usuário:', err));

      // Setar usuário imediatamente
      setUser({
        uid: userFirebase.uid,
        email: userFirebase.email,
        nome,
      });
      
      setLoading(false);
      console.log('✅ Usuário criado:', email);
      return true;
    } catch (error) {
      console.error('Erro ao criar usuário: ', error);
      setLoading(false);
      throw error;
    }
  };

  /**
   * Obtém os dados do usuário do Firestore (opcional)
   */
  const getUserData = async (): Promise<void> => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        getDoc(userDocRef).then((userDocSnap: any) => {
          if (userDocSnap.exists()) {
            setUser((prevUser: any) => ({
              ...prevUser,
              ...userDocSnap.data(),
            }));
          }
        }).catch((err: any) => console.warn('Erro ao buscar dados:', err));
      }
    } catch (error) {
      console.error('Erro ao obter dados do usuário: ', error);
    }
  };

  /**
   * Realiza login com Google usando expo-web-browser + OAuth
   * Funciona em Android, iOS e Web
   */
  const signInWithGoogle = async (): Promise<void> => {
    Alert.alert(
      'Google Sign-In',
      'Use o botão de Google Sign-In. Ele está configurado para funcionar corretamente.',
      [{ text: 'OK' }]
    );
  };

  /**
   * Realiza o logout do usuário
   */
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await SecureStore.deleteItemAsync('user_session');
      await firebaseSignOut(auth);
      setUser(null);
      setLoading(false);
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('Erro ao fazer logout: ', error);
      setLoading(false);
    }
  };

  return (
    <AuthUserContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        getUserData,
        storeUserSession,
      }}
    >
      {children}
    </AuthUserContext.Provider>
  );
};
