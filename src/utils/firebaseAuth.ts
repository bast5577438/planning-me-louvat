import { initializeApp, deleteApp } from 'firebase/app';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  getAuth,
} from 'firebase/auth';
import { auth, firebaseConfig } from './firebase';

export const loginWithEmailPassword = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const onAuthStateChange = (cb: (user: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, cb);

// Crée un compte Firebase Auth sans déconnecter l'utilisateur actuel (trick secondary app)
export const createFirebaseUser = async (email: string, password: string): Promise<string> => {
  const tmpApp = initializeApp(firebaseConfig, `tmp-${Date.now()}`);
  const tmpAuth = getAuth(tmpApp);
  try {
    const { user } = await createUserWithEmailAndPassword(tmpAuth, email, password);
    return user.uid;
  } finally {
    await signOut(tmpAuth).catch(() => {});
    await deleteApp(tmpApp).catch(() => {});
  }
};
