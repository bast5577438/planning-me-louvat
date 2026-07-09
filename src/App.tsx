import React, { useState, useEffect } from 'react';
import { User, Location, Reservation, AppSettings, NotificationLog } from './types';
import {
  getUsers,
  saveUsers,
  getLocations,
  saveLocations,
  getReservations,
  saveReservations,
  getSettings,
  saveSettings,
  getNotifications,
  saveNotifications,
  initializeStorage,
  DEFAULT_USERS,
  DEFAULT_LOCATIONS,
  DEFAULT_RESERVATIONS,
  DEFAULT_SETTINGS,
  DEFAULT_NOTIFICATIONS
} from './utils/storage';
import {
  seedFirestoreIfEmpty,
  subscribeToUsers,
  subscribeToLocations,
  subscribeToReservations,
  subscribeToSettings,
  subscribeToNotifications,
  saveNotificationToFirestore,
  clearNotificationsInFirestore,
  saveSettingsToFirestore,
  syncUsersWithFirestore,
  syncLocationsWithFirestore,
  syncReservationsWithFirestore
} from './utils/firestoreSync';
import { loginWithEmailPassword, logoutUser, onAuthStateChange, createFirebaseUser } from './utils/firebaseAuth';
import { Navbar } from './components/Navbar';
import { LouvatLogo } from './components/LouvatLogo';
import { CalendarView } from './components/CalendarView';
import { AdminDashboard } from './components/AdminDashboard';
import { PartnersManager } from './components/PartnersManager';
import { SettingsManager } from './components/SettingsManager';
import { Exporter } from './components/Exporter';
import { NotificationCenter } from './components/NotificationCenter';
import { KeyRound, Mail, ShieldAlert, ArrowRight, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeView, setActiveView] = useState<'calendar' | 'dashboard' | 'partners' | 'settings' | 'notifications'>('calendar');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Email du user Firebase Auth connecté (matching avec le profil Firestore)
  const [firebaseEmail, setFirebaseEmail] = useState<string | null>(null);

  // Charge le cache local dès le montage (affichage instantané)
  useEffect(() => {
    initializeStorage();
    setAllUsers(getUsers());
    setLocations(getLocations());
    setReservations(getReservations());
    setSettings(getSettings());
    setNotifications(getNotifications());
  }, []);

  // Écoute l'état Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChange((fbUser) => {
      setFirebaseEmail(fbUser ? (fbUser.email ?? null) : null);
      if (!fbUser) {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Synchronisation Firestore — démarre UNIQUEMENT une fois authentifié
  // (les règles Firestore exigent request.auth != null)
  useEffect(() => {
    if (!firebaseEmail) return;

    let unsubs: (() => void)[] = [];

    const setupSync = async () => {
      await seedFirestoreIfEmpty(
        DEFAULT_USERS,
        DEFAULT_LOCATIONS,
        DEFAULT_RESERVATIONS,
        DEFAULT_SETTINGS,
        DEFAULT_NOTIFICATIONS
      );

      unsubs.push(subscribeToUsers((users) => {
        setAllUsers(users);
        saveUsers(users);
      }));
      unsubs.push(subscribeToLocations((locs) => {
        setLocations(locs);
        saveLocations(locs);
      }));
      unsubs.push(subscribeToReservations((resList) => {
        setReservations(resList);
        saveReservations(resList);
      }));
      unsubs.push(subscribeToSettings((sett) => {
        setSettings(sett);
        saveSettings(sett);
      }));
      unsubs.push(subscribeToNotifications((notifs) => {
        setNotifications(notifs);
        saveNotifications(notifs);
      }));
    };

    setupSync().catch((err) => console.error('Firestore connection error:', err));
    return () => unsubs.forEach(u => u());
  }, [firebaseEmail]);

  // Quand firebaseEmail ET allUsers sont prêts → trouve le profil applicatif
  useEffect(() => {
    if (firebaseEmail && allUsers.length > 0) {
      const profile = allUsers.find(u => u.email.toLowerCase() === firebaseEmail.toLowerCase());
      if (profile) {
        setCurrentUser(profile);
      }
    }
  }, [firebaseEmail, allUsers]);

  const handleUpdateUsers = (newUsers: User[]) => {
    const old = [...allUsers];
    setAllUsers(newUsers);
    saveUsers(newUsers);
    syncUsersWithFirestore(newUsers, old);
  };

  const handleUpdateLocations = (newLocations: Location[]) => {
    const old = [...locations];
    setLocations(newLocations);
    saveLocations(newLocations);
    syncLocationsWithFirestore(newLocations, old);
  };

  const handleUpdateReservations = (newReservations: Reservation[]) => {
    const old = [...reservations];
    setReservations(newReservations);
    saveReservations(newReservations);
    syncReservationsWithFirestore(newReservations, old);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    saveSettingsToFirestore(newSettings);
  };

  const handleAddNotificationLog = (newLog: NotificationLog) => {
    const updated = [newLog, ...notifications];
    setNotifications(updated);
    saveNotifications(updated);
    saveNotificationToFirestore(newLog);
  };

  const handleClearNotifications = () => {
    const current = [...notifications];
    setNotifications([]);
    saveNotifications([]);
    clearNotificationsInFirestore(current);
  };

  const handleUserChange = (user: User | null) => {
    if (user === null) {
      logoutUser().catch(console.error);
    }
    setCurrentUser(user);
    if (user && user.role === 'PARTNER') {
      setActiveView('calendar');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoginLoading(true);

    const formattedEmail = email.trim().toLowerCase();

    try {
      await loginWithEmailPassword(formattedEmail, password);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      const code = err?.code ?? '';

      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        // L'email existe-t-il dans la base locale (utilisateur pré-existant sans compte Firebase Auth) ?
        const knownUsers = allUsers.length > 0 ? allUsers : getUsers();
        const foundUser = knownUsers.find(u => u.email.toLowerCase() === formattedEmail);
        if (foundUser && (foundUser.password || 'louvat1954') === password) {
          // Migration automatique : crée le compte Firebase Auth puis connecte
          try {
            await createFirebaseUser(formattedEmail, password);
            await loginWithEmailPassword(formattedEmail, password);
            setEmail('');
            setPassword('');
          } catch (createErr: any) {
            if (createErr?.code === 'auth/email-already-in-use') {
              setAuthError('Mot de passe incorrect. Réessayez.');
            } else if (createErr?.code === 'auth/weak-password') {
              setAuthError('Mot de passe trop court pour Firebase (6 caractères minimum). Contactez la gérante.');
            } else {
              setAuthError('Erreur de connexion. Vérifiez vos identifiants.');
              console.error('Firebase Auth migration error:', createErr);
            }
          }
        } else if (foundUser) {
          setAuthError('Le mot de passe saisi est incorrect.');
        } else {
          setAuthError('Email non reconnu dans la base des auto-entrepreneurs.');
        }
      } else if (code === 'auth/wrong-password') {
        setAuthError('Le mot de passe saisi est incorrect.');
      } else if (code === 'auth/invalid-email') {
        setAuthError("Format d'email invalide.");
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Trop de tentatives. Réessayez dans quelques minutes.');
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError("La connexion Email/Mot de passe n'est pas activée dans Firebase. Activez-la dans la console Firebase → Authentication → Sign-in method.");
      } else {
        setAuthError('Erreur de connexion. Vérifiez vos identifiants.');
        console.error('Firebase Auth error:', err);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const getPartnerCurrentMonthStats = (partnerId: string) => {
    const decReservations = reservations.filter(r => r.userId === partnerId && r.date.startsWith('2026-12'));
    const days = decReservations.length;
    const hours = decReservations.reduce((sum, r) => sum + r.hours, 0);
    const payout = decReservations.reduce((sum, r) => sum + (r.hours * r.hourlyRate), 0);
    return { days, hours, payout };
  };

  // Écran de chargement Firebase Auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LouvatLogo className="h-16 w-auto mx-auto" color="text-[#8B5E3C]" />
          <Loader2 className="h-6 w-6 animate-spin text-[#8B5E3C] mx-auto" />
          <p className="text-xs text-stone-500 font-medium">Connexion sécurisée…</p>
        </div>
      </div>
    );
  }

  // Écran de connexion
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <LouvatLogo className="h-20 w-auto" color="text-[#8B5E3C]" />
          </div>
          <p className="text-xs uppercase tracking-widest text-stone-500 font-bold">
            Espace Collaborateur & Planification
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 border border-stone-200 shadow-xl rounded-2xl sm:px-10 space-y-6">

            {authError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Adresse e-mail professionnelle :
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 w-full text-sm bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder="Ex: emma@louvat.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Mot de passe :
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 w-full text-sm bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                    placeholder="Saisissez votre code d'accès"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex justify-center items-center gap-1.5 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-stone-50 bg-amber-800 hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all disabled:opacity-60"
              >
                {loginLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>S'identifier</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

          </div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-[#FAF9F5] border border-stone-200 rounded-2xl p-4 text-[11px] text-stone-600/95 leading-relaxed text-justify space-y-2 mt-4 shadow-3xs">
          <div className="flex items-center gap-1.5 text-[#8B5E3C] font-extrabold uppercase tracking-wider text-[10px]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#8B5E3C]" />
            <span>Cadre de Collaboration Indépendante (B2B)</span>
          </div>
          <p>
            Tous les auto-entrepreneurs et prestataires de services indépendants utilisant cet outil sont des <strong>micro-entrepreneurs</strong> autonomes.
          </p>
          <p>
            Chaque auto-entrepreneur est entièrement libre de se positionner sur les créneaux de son choix, d'organiser son temps de travail de manière autonome, et n'a <strong>aucun lien de subordination hiérarchique</strong> avec la Biscuiterie Louvat.
          </p>
        </div>

        <div className="text-center text-xs text-stone-400 mt-6">
          <p>© 2026 Biscuiterie Louvat — Outil d'organisation interne.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        allUsers={allUsers}
        onUserChange={handleUserChange}
        onNavigate={(view) => setActiveView(view)}
        activeView={activeView}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {currentUser.role === 'PARTNER' && (
          <div className="bg-amber-900 text-stone-50 p-4 sm:p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:justify-between md:items-center gap-4 border border-amber-950">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-xl bg-amber-800 border border-amber-700 flex items-center justify-center text-xl font-bold select-none">
                🍪
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold leading-tight">
                  Bonjour, {currentUser.name} !
                </h2>
                <p className="text-xs text-amber-200/90 font-medium">
                  Bienvenue sur votre planning de prestations commerciales.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 border-t border-amber-800/80 md:border-t-0 pt-3 md:pt-0 text-center text-xs self-stretch md:self-auto">
              <div className="bg-amber-950/40 p-2 rounded-xl border border-amber-800/40">
                <span className="text-[9px] uppercase tracking-wider font-bold text-amber-200/70 block">Journées (Déc)</span>
                <span className="font-serif font-bold text-sm sm:text-base">{getPartnerCurrentMonthStats(currentUser.id).days} j</span>
              </div>
              <div className="bg-amber-950/40 p-2 rounded-xl border border-amber-800/40">
                <span className="text-[9px] uppercase tracking-wider font-bold text-amber-200/70 block">Heures (Déc)</span>
                <span className="font-serif font-bold text-sm sm:text-base">{getPartnerCurrentMonthStats(currentUser.id).hours}h</span>
              </div>
              <div className="bg-amber-950/40 p-2 rounded-xl border border-amber-800/40">
                <span className="text-[9px] uppercase tracking-wider font-bold text-amber-200/70 block">À payer (Brut)</span>
                <span className="font-serif font-bold text-sm sm:text-base text-amber-300">{getPartnerCurrentMonthStats(currentUser.id).payout} €</span>
              </div>
            </div>
          </div>
        )}

        <div>
          {activeView === 'calendar' && settings && (
            <CalendarView
              currentUser={currentUser}
              allUsers={allUsers}
              locations={locations}
              reservations={reservations}
              settings={settings}
              onUpdateReservations={handleUpdateReservations}
              onAddNotificationLog={handleAddNotificationLog}
            />
          )}

          {activeView === 'dashboard' && currentUser.role === 'ADMIN' && settings && (
            <AdminDashboard
              allUsers={allUsers}
              locations={locations}
              reservations={reservations}
              settings={settings}
              onNavigateToCalendar={() => setActiveView('calendar')}
              onAddNotificationLog={handleAddNotificationLog}
            />
          )}

          {activeView === 'partners' && currentUser.role === 'ADMIN' && (
            <PartnersManager
              users={allUsers}
              onUpdateUsers={handleUpdateUsers}
              currentUser={currentUser}
            />
          )}

          {activeView === 'settings' && currentUser.role === 'ADMIN' && settings && (
            <SettingsManager
              locations={locations}
              settings={settings}
              onUpdateLocations={handleUpdateLocations}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeView === 'notifications' && (
            <div className="space-y-6">
              <NotificationCenter
                logs={notifications}
                onClearLogs={handleClearNotifications}
              />
              {currentUser.role === 'ADMIN' && (
                <Exporter
                  allUsers={allUsers}
                  locations={locations}
                  reservations={reservations}
                  settings={settings}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-400 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2026 Biscuiterie Louvat. Tous droits réservés.</p>
          <span className="font-semibold text-stone-500">Maison fondée en 1954 à Saint-Geoire-en-Valdaine (Isère)</span>
        </div>
      </footer>
    </div>
  );
}
