import * as SecureStore from 'expo-secure-store';
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { app, auth } from '../services/firebase/config';

interface AppUser {
  uid: string;
  email: string;
  nome?: string;
  phone?: string;
  photoURL?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
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
  signIn: async () => { },
  signUp: async () => false,
  signOut: async () => { },
  signInWithGoogle: async () => { },
  getUserData: async () => { },
  storeUserSession: async () => false,
});

const db = getFirestore(app);

interface AuthUserProviderProps {
  children: ReactNode;
}

function mapFirebaseUser(firebaseUser: any): AppUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    nome: firebaseUser.displayName || firebaseUser.email || 'Jogador',
    photoURL: firebaseUser.photoURL || null,
  };
}

export const AuthUserProvider: React.FC<AuthUserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('✅ Auth Provider inicializado');

    const unsubscribe = (auth as any).onAuthStateChanged(
      async (firebaseUser: any) => {
        try {
          setLoading(true);

          if (!firebaseUser) {
            setUser(null);
            console.log('ℹ️ Nenhum usuário autenticado');
            setLoading(false);
            return;
          }

          const mappedUser = mapFirebaseUser(firebaseUser);

          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              setUser({
                ...mappedUser,
                ...userDocSnap.data(),
              });
            } else {
              await setDoc(
                userDocRef,
                {
                  nome: mappedUser.nome,
                  email: mappedUser.email,
                  photoURL: mappedUser.photoURL || null,
                  createdAt: new Date(),
                },
                { merge: true }
              );

              setUser(mappedUser);
            }
          } catch (firestoreError) {
            console.warn('⚠️ Erro ao carregar perfil do Firestore:', firestoreError);
            setUser(mappedUser);
          }

          console.log('✅ Usuário autenticado no contexto:', mappedUser.email);
        } catch (error) {
          console.error('❌ Erro no onAuthStateChanged:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

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
      console.error('Erro ao armazenar a sessão do usuário:', error);
      return false;
    }
  };

  const signIn = async (email: string, senha: string): Promise<void> => {
    try {
      setLoading(true);

      const credential = await signInWithEmailAndPassword(auth as any, email, senha);
      await storeUserSession(email, senha);

      console.log('✅ Login realizado:', credential.user.email || email);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (nome: string, email: string, senha: string): Promise<boolean> => {
    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth as any,
        email,
        senha
      );

      const userFirebase = userCredential.user;

      await setDoc(
        doc(db, 'users', userFirebase.uid),
        {
          nome,
          email,
          photoURL: userFirebase.photoURL || null,
          createdAt: new Date(),
        },
        { merge: true }
      );

      setUser({
        uid: userFirebase.uid,
        email: userFirebase.email || email,
        nome,
        photoURL: userFirebase.photoURL || null,
      });

      console.log('✅ Usuário criado:', email);
      return true;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUserData = async (): Promise<void> => {
    try {
      const currentUser = (auth as any).currentUser;

      if (!currentUser) {
        setUser(null);
        return;
      }

      const mappedUser = mapFirebaseUser(currentUser);
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setUser({
          ...mappedUser,
          ...userDocSnap.data(),
        });
      } else {
        setUser(mappedUser);
      }
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    Alert.alert(
      'Google Sign-In',
      'Use o botão de Google Sign-In da tela de login. Ele está usando o fluxo nativo.'
    );
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);

      await SecureStore.deleteItemAsync('user_session');
      await firebaseSignOut(auth as any);

      setUser(null);
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
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