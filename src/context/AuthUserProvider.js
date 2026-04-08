import React, { createContext, useState, useEffect } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '@env';

export const AuthUserContext = createContext({});

export const AuthUserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
    retrieveUserSession();
  }, []);

  /**
   * Armazena a sessão do usuário de forma criptografada
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @returns {Promise<boolean>} - Retorna true se a sessão foi armazenada com sucesso
   */
  const storeUserSession = async (email, senha) => {
    try {
      await EncryptedStorage.setItem(
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
   * Recupera a sessão do usuário armazenada de forma criptografada
   */
  const retrieveUserSession = async () => {
    try {
      const session = await EncryptedStorage.getItem('user_session');
      if (session) {
        const { email, senha } = JSON.parse(session);
        signIn(email, senha);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao recuperar a sessão do usuário: ', error);
      setLoading(false);
    }
  };

  /**
   * Realiza o login do usuário
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   */
  const signIn = async (email, senha) => {
    try {
      setLoading(true);
      await auth().signInWithEmailAndPassword(email, senha);
      await getUserData();
      setLoading(false);
    } catch (error) {
      console.error('Erro ao fazer login: ', error);
      setLoading(false);
    }
  };

  /**
   * Cria um novo usuário
   * @param {string} nome - Nome do usuário
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   */
  const signUp = async (nome, email, senha) => {
    try {
      setLoading(true);
      await auth().createUserWithEmailAndPassword(email, senha);
      const userFirebase = auth().currentUser;
      
      await firestore()
        .collection('users')
        .doc(userFirebase.uid)
        .set({
          nome,
          email,
          createdAt: new Date(),
        });

      await userFirebase.sendEmailVerification();
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Erro ao criar usuário: ', error);
      setLoading(false);
      throw error;
    }
  };

  /**
   * Obtém os dados do usuário do Firestore
   */
  const getUserData = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        const userDoc = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .get();
        
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          ...userDoc.data(),
        });
      }
    } catch (error) {
      console.error('Erro ao obter dados do usuário: ', error);
    }
  };

  /**
   * Realiza login com Google
   */
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const credential = auth.GoogleAuthProvider.credential(
        userInfo.idToken,
        userInfo.accessToken
      );
      await auth().signInWithCredential(credential);
      await getUserData();
      setLoading(false);
    } catch (error) {
      console.error('Erro ao fazer login com Google: ', error);
      setLoading(false);
      throw error;
    }
  };

  /**
   * Realiza o logout do usuário
   */
  const signOut = async () => {
    try {
      setLoading(true);
      await EncryptedStorage.removeItem('user_session');
      await GoogleSignin.revokeAccess();
      await auth().signOut();
      setUser(null);
      setLoading(false);
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
