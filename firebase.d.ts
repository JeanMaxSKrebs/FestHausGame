// Firebase type declarations for v12+
// These declarations suppress TypeScript errors for Firebase SDK modules
declare module 'firebase/app' {
  export const initializeApp: any;
}

declare module 'firebase/auth' {
  export const getAuth: any;
  export const createUserWithEmailAndPassword: any;
  export const signInWithEmailAndPassword: any;
  export const signOut: any;
  export const GoogleAuthProvider: any;
  export const signInWithCredential: any;
  export const signInWithPopup: any;
}

declare module 'firebase/firestore' {
  export const getFirestore: any;
  export const doc: any;
  export const setDoc: any;
  export const getDoc: any;
  export const collection: any;
  export const getDocs: any;
  export const onSnapshot: any;
  export const Timestamp: any;
  export const updateDoc: any;
  export const writeBatch: any;
}
