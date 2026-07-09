/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Location, Reservation, AppSettings, NotificationLog } from '../types';

// Constants for LocalStorage keys
const USERS_KEY = 'louvat_users';
const LOCATIONS_KEY = 'louvat_locations';
const RESERVATIONS_KEY = 'louvat_reservations';
const SETTINGS_KEY = 'louvat_settings';
const NOTIFICATIONS_KEY = 'louvat_notifications';
const CURRENT_USER_KEY = 'louvat_current_user';

// Initial pre-seeded users
export const DEFAULT_USERS: User[] = [
  {
    id: '1',
    name: 'La Gérante (Admin)',
    email: 'cib@biscuiterie-louvat.com',
    role: 'ADMIN',
    color: '#854d0e', // Amber / bronze
    phone: '06 12 34 56 78',
    isActive: true,
    password: 'louvat1954',
  },
  {
    id: '2',
    name: 'Béatrice',
    email: 'beatrice@louvat.com',
    role: 'PARTNER',
    color: '#0284c7', // Sky Blue
    phone: '06 88 77 66 55',
    isActive: true,
    password: 'louvat1954',
  },
  {
    id: '3',
    name: 'Emma',
    email: 'emma@louvat.com',
    role: 'PARTNER',
    color: '#db2777', // Pink
    phone: '06 77 88 99 00',
    isActive: true,
    password: 'louvat1954',
  },
  {
    id: '4',
    name: 'Anne-Laure',
    email: 'annelaure@louvat.com',
    role: 'PARTNER',
    color: '#059669', // Emerald
    phone: '06 44 33 22 11',
    isActive: true,
    password: 'louvat1954',
  },
  {
    id: '5',
    name: 'Nadège',
    email: 'nadege@louvat.com',
    role: 'PARTNER',
    color: '#7c3aed', // Violet
    phone: '06 55 44 33 22',
    isActive: true,
    password: 'louvat1954',
  },
  {
    id: '6',
    name: 'Maud',
    email: 'maud@louvat.com',
    role: 'PARTNER',
    color: '#ea580c', // Orange
    phone: '06 66 11 22 33',
    isActive: true,
    password: 'louvat1954',
  },
];

// Initial locations with dates for 2026
export const DEFAULT_LOCATIONS: Location[] = [
  {
    id: 'loc_voiron',
    name: 'Boutique de Voiron',
    code: 'VOIRON',
    description: 'Boutique principale située au cœur de Voiron.',
    startDate: '',
    endDate: '',
    color: 'amber', // Amber/warm theme
    isActive: true,
  },
  {
    id: 'loc_sgv',
    name: "Magasin d'usine St-Geoire",
    code: 'SGV',
    description: "Magasin d'usine de fabrication artisanale historique.",
    startDate: '',
    endDate: '',
    color: 'emerald', // Forest/emerald theme
    isActive: true,
  },
  {
    id: 'loc_xm_voiron',
    name: 'Marché de Noël Voiron',
    code: 'XM_VOIRON',
    description: 'Chalet éphémère de Noël sur la place centrale de Voiron.',
    startDate: '2026-12-16',
    endDate: '2026-12-24',
    color: 'rose', // Holiday rose red
    isActive: true,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  maxPartnersPerDay: 1, // Default limit is 1, but admin can change it
  defaultHourlyRate: 20, // 20 €/h
  defaultHoursPerDay: 8, // 8h per day
  cancellationDeadlineDays: 2, // 2 days
  notificationEmail: 'cib@bicuiterie-louvat.com',
  enableEmailAlerts: true,
};

// Aucune donnée de démo : la gérante saisit les vraies réservations
export const DEFAULT_RESERVATIONS: Reservation[] = [];

export const DEFAULT_NOTIFICATIONS: NotificationLog[] = [];

// Initialize LocalStorage with default data if empty
export const initializeStorage = (): void => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(LOCATIONS_KEY)) {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(DEFAULT_LOCATIONS));
  }
  if (!localStorage.getItem(RESERVATIONS_KEY)) {
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(DEFAULT_RESERVATIONS));
  }
  if (!localStorage.getItem(SETTINGS_KEY)) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
  }
  // No automatic login - CURRENT_USER_KEY is not set by default to allow manual login on open
};

// Generic helper methods
function get<T>(key: string, defaultValue: T): T {
  initializeStorage();
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// User-facing Get/Set operations
export const getUsers = (): User[] => get<User[]>(USERS_KEY, DEFAULT_USERS);
export const saveUsers = (users: User[]): void => set<User[]>(USERS_KEY, users);

export const getLocations = (): Location[] => get<Location[]>(LOCATIONS_KEY, DEFAULT_LOCATIONS);
export const saveLocations = (locations: Location[]): void => set<Location[]>(LOCATIONS_KEY, locations);

export const getReservations = (): Reservation[] => get<Reservation[]>(RESERVATIONS_KEY, DEFAULT_RESERVATIONS);
export const saveReservations = (reservations: Reservation[]): void => set<Reservation[]>(RESERVATIONS_KEY, reservations);

export const getSettings = (): AppSettings => get<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
export const saveSettings = (settings: AppSettings): void => set<AppSettings>(SETTINGS_KEY, settings);

export const getNotifications = (): NotificationLog[] => get<NotificationLog[]>(NOTIFICATIONS_KEY, DEFAULT_NOTIFICATIONS);
export const saveNotifications = (logs: NotificationLog[]): void => set<NotificationLog[]>(NOTIFICATIONS_KEY, logs);

export const getCurrentUser = (): User | null => {
  initializeStorage();
  // Always return null on load to force user login on connection (no automatic auth)
  localStorage.removeItem(CURRENT_USER_KEY);
  return null;
};
export const saveCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Simulated Notification Engine
export const triggerNotification = (
  type: 'EMAIL' | 'SMS',
  recipient: string,
  subject: string,
  message: string
): NotificationLog => {
  const logs = getNotifications();
  const newLog: NotificationLog = {
    id: `not_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    recipient,
    subject,
    message,
    status: 'SENT',
  };
  saveNotifications([newLog, ...logs]);
  return newLog;
};
