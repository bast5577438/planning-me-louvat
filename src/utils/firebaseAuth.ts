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
import { User } from '../types';

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

// S'assure que CHAQUE utilisateur du tableau a un vrai compte Firebase Auth.
// Nécessaire car les comptes créés avant l'intégration Firebase Auth (ou dont l'email
// a été modifié manuellement dans le tableau) n'ont jamais de compte Auth réel —
// sans ça, un prestataire ne peut pas se connecter depuis un appareil qui n'a jamais
// synchronisé Firestore (l'app ne peut pas encore lire la base pour vérifier son email).
export const ensureAllUsersHaveFirebaseAuthAccounts = async (users: User[]): Promise<void> => {
  for (const u of users) {
    const password = (u.password && u.password.length >= 6) ? u.password : 'louvat1954';
    try {
      await createFirebaseUser(u.email.toLowerCase(), password);
    } catch (err: any) {
      // auth/email-already-in-use = déjà migré, rien à faire — on ignore silencieusement
      if (err?.code !== 'auth/email-already-in-use') {
        console.error(`Migration Firebase Auth échouée pour ${u.email} :`, err?.code ?? err);
      }
    }
  }
};
