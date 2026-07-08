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
    startDate: 'voir tati',
    endDate: 'voir tati',
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

// Seed realistic reservations in September and December 2026 to show full dashboard metrics
export const DEFAULT_RESERVATIONS: Reservation[] = [
  // --- SEPTEMBER 2026 --- (Boutique de Voiron is open)
  { id: 'res_1', userId: '3', userName: 'Emma', locationId: 'loc_voiron', date: '2026-09-01', hours: 8, hourlyRate: 20 },
  { id: 'res_2', userId: '3', userName: 'Emma', locationId: 'loc_voiron', date: '2026-09-02', hours: 8, hourlyRate: 20 },
  { id: 'res_3', userId: '2', userName: 'Béatrice', locationId: 'loc_voiron', date: '2026-09-03', hours: 8, hourlyRate: 20 },
  { id: 'res_4', userId: '2', userName: 'Béatrice', locationId: 'loc_voiron', date: '2026-09-04', hours: 8, hourlyRate: 20 },
  { id: 'res_5', userId: '4', userName: 'Anne-Laure', locationId: 'loc_voiron', date: '2026-09-05', hours: 8, hourlyRate: 20 },
  { id: 'res_6', userId: '5', userName: 'Nadège', locationId: 'loc_voiron', date: '2026-09-07', hours: 8, hourlyRate: 20 },
  { id: 'res_7', userId: '3', userName: 'Emma', locationId: 'loc_voiron', date: '2026-09-08', hours: 8, hourlyRate: 20 },
  { id: 'res_8', userId: '3', userName: 'Emma', locationId: 'loc_voiron', date: '2026-09-09', hours: 8, hourlyRate: 20 },
  { id: 'res_9', userId: '2', userName: 'Béatrice', locationId: 'loc_voiron', date: '2026-09-10', hours: 8, hourlyRate: 20 },
  { id: 'res_10', userId: '6', userName: 'Maud', locationId: 'loc_voiron', date: '2026-09-11', hours: 8, hourlyRate: 20 },
  { id: 'res_11', userId: '4', userName: 'Anne-Laure', locationId: 'loc_voiron', date: '2026-09-12', hours: 8, hourlyRate: 20 },
  { id: 'res_12', userId: '5', userName: 'Nadège', locationId: 'loc_voiron', date: '2026-09-14', hours: 8, hourlyRate: 20 },
  { id: 'res_13', userId: '6', userName: 'Maud', locationId: 'loc_voiron', date: '2026-09-15', hours: 8, hourlyRate: 20 },
  { id: 'res_14', userId: '3', userName: 'Emma', locationId: 'loc_voiron', date: '2026-09-16', hours: 8, hourlyRate: 20 },
  { id: 'res_15', userId: '2', userName: 'Béatrice', locationId: 'loc_voiron', date: '2026-09-17', hours: 8, hourlyRate: 20 },
  { id: 'res_16', userId: '2', userName: 'Béatrice', locationId: 'loc_voiron', date: '2026-09-18', hours: 8, hourlyRate: 20 },
  { id: 'res_17', userId: '4', userName: 'Anne-Laure', locationId: 'loc_voiron', date: '2026-09-19', hours: 8, hourlyRate: 20 },
  { id: 'res_18', userId: '5', userName: 'Nadège', locationId: 'loc_voiron', date: '2026-09-21', hours: 8, hourlyRate: 20 },
  { id: 'res_19', userId: '3', userName: 'Emma', locationId: 'loc_voiron', date: '2026-09-22', hours: 8, hourlyRate: 20 },
  { id: 'res_20', userId: '3', userName: 'Emma', locationId: 'loc_voiron', date: '2026-09-23', hours: 8, hourlyRate: 20 },
  { id: 'res_21', userId: '2', userName: 'Béatrice', locationId: 'loc_voiron', date: '2026-09-24', hours: 8, hourlyRate: 20 },
  { id: 'res_22', userId: '6', userName: 'Maud', locationId: 'loc_voiron', date: '2026-09-25', hours: 8, hourlyRate: 20 },
  { id: 'res_23', userId: '4', userName: 'Anne-Laure', locationId: 'loc_voiron', date: '2026-09-26', hours: 8, hourlyRate: 20 },
  { id: 'res_24', userId: '5', userName: 'Nadège', locationId: 'loc_voiron', date: '2026-09-28', hours: 8, hourlyRate: 20 },
  { id: 'res_25', userId: '3', userName: 'Emma', locationId: 'loc_voiron', date: '2026-09-29', hours: 8, hourlyRate: 20 },

  // --- DECEMBER 2026 --- (All three locations can be open)
  // Boutique Voiron
  { id: 'res_101', userId: '3', userName: 'Emma', locationId: 'loc_voiron', date: '2026-12-01', hours: 8, hourlyRate: 20 },
  { id: 'res_102', userId: '2', userName: 'Béatrice', locationId: 'loc_voiron', date: '2026-12-02', hours: 8, hourlyRate: 20 },
  { id: 'res_103', userId: '2', userName: 'Béatrice', locationId: 'loc_voiron', date: '2026-12-03', hours: 8, hourlyRate: 20 },
  { id: 'res_104', userId: '4', userName: 'Anne-Laure', locationId: 'loc_voiron', date: '2026-12-04', hours: 8, hourlyRate: 20 },
  { id: 'res_105', userId: '5', userName: 'Nadège', locationId: 'loc_voiron', date: '2026-12-07', hours: 8, hourlyRate: 20 },
  { id: 'res_106', userId: '6', userName: 'Maud', locationId: 'loc_voiron', date: '2026-12-08', hours: 8, hourlyRate: 20 },
  { id: 'res_107', userId: '3', userName: 'Emma', locationId: 'loc_voiron', date: '2026-12-09', hours: 8, hourlyRate: 20 },
  { id: 'res_108', userId: '2', userName: 'Béatrice', locationId: 'loc_voiron', date: '2026-12-10', hours: 8, hourlyRate: 20 },
  
  // Magasin d'usine SGV (opens Dec 7)
  { id: 'res_201', userId: '4', userName: 'Anne-Laure', locationId: 'loc_sgv', date: '2026-12-07', hours: 8, hourlyRate: 20 },
  { id: 'res_202', userId: '4', userName: 'Anne-Laure', locationId: 'loc_sgv', date: '2026-12-08', hours: 8, hourlyRate: 20 },
  { id: 'res_203', userId: '5', userName: 'Nadège', locationId: 'loc_sgv', date: '2026-12-09', hours: 8, hourlyRate: 20 },
  { id: 'res_204', userId: '2', userName: 'Béatrice', locationId: 'loc_sgv', date: '2026-12-10', hours: 8, hourlyRate: 20 },
  { id: 'res_205', userId: '3', userName: 'Emma', locationId: 'loc_sgv', date: '2026-12-11', hours: 8, hourlyRate: 20 },

  // Marché de Noël Voiron (opens Dec 16 - Dec 24, capacity 2 on busy days!)
  { id: 'res_301', userId: '3', userName: 'Emma', locationId: 'loc_xm_voiron', date: '2026-12-16', hours: 8, hourlyRate: 20 },
  { id: 'res_302', userId: '6', userName: 'Maud', locationId: 'loc_xm_voiron', date: '2026-12-16', hours: 8, hourlyRate: 20 }, // Shared day!
  { id: 'res_303', userId: '2', userName: 'Béatrice', locationId: 'loc_xm_voiron', date: '2026-12-17', hours: 8, hourlyRate: 20 },
  { id: 'res_304', userId: '5', userName: 'Nadège', locationId: 'loc_xm_voiron', date: '2026-12-17', hours: 8, hourlyRate: 20 }, // Shared day!
  { id: 'res_305', userId: '4', userName: 'Anne-Laure', locationId: 'loc_xm_voiron', date: '2026-12-18', hours: 8, hourlyRate: 20 },
  { id: 'res_306', userId: '3', userName: 'Emma', locationId: 'loc_xm_voiron', date: '2026-12-19', hours: 8, hourlyRate: 20 },
  { id: 'res_307', userId: '2', userName: 'Béatrice', locationId: 'loc_xm_voiron', date: '2026-12-20', hours: 8, hourlyRate: 20 },
  { id: 'res_308', userId: '4', userName: 'Anne-Laure', locationId: 'loc_xm_voiron', date: '2026-12-21', hours: 8, hourlyRate: 20 },
  { id: 'res_309', userId: '5', userName: 'Nadège', locationId: 'loc_xm_voiron', date: '2026-12-21', hours: 8, hourlyRate: 20 }, // Shared day!
  { id: 'res_310', userId: '3', userName: 'Emma', locationId: 'loc_xm_voiron', date: '2026-12-22', hours: 8, hourlyRate: 20 },
  { id: 'res_311', userId: '6', userName: 'Maud', locationId: 'loc_xm_voiron', date: '2026-12-22', hours: 8, hourlyRate: 20 }, // Shared day!
  { id: 'res_312', userId: '2', userName: 'Béatrice', locationId: 'loc_xm_voiron', date: '2026-12-23', hours: 8, hourlyRate: 20 },
  { id: 'res_313', userId: '5', userName: 'Nadège', locationId: 'loc_xm_voiron', date: '2026-12-23', hours: 8, hourlyRate: 20 }, // Shared day!
  { id: 'res_314', userId: '4', userName: 'Anne-Laure', locationId: 'loc_xm_voiron', date: '2026-12-24', hours: 8, hourlyRate: 20 },
  { id: 'res_315', userId: '3', userName: 'Emma', locationId: 'loc_xm_voiron', date: '2026-12-24', hours: 8, hourlyRate: 20 }, // Shared day!
];

export const DEFAULT_NOTIFICATIONS: NotificationLog[] = [
  {
    id: 'not_1',
    timestamp: '2026-07-06T08:00:00.000Z',
    type: 'EMAIL',
    recipient: 'cib@biscuiterie-louvat.com',
    subject: 'Nouvelle réservation effectuée',
    message: 'L\'auto-entrepreneur Emma a réservé la journée du 2026-09-01 à la Boutique de Voiron.',
    status: 'SENT',
  },
  {
    id: 'not_2',
    timestamp: '2026-07-06T08:00:01.000Z',
    type: 'EMAIL',
    recipient: 'emma@louvat.com',
    subject: 'Confirmation de votre réservation - Louvat',
    message: 'Votre réservation pour le 2026-09-01 à la Boutique de Voiron a bien été enregistrée (8h @ 20€/h = 160€).',
    status: 'SENT',
  },
];

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
  if (!localStorage.getItem(CURRENT_USER_KEY)) {
    // Default logged in user is the Admin, to make testing easiest!
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(DEFAULT_USERS[0]));
  }
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
  const item = localStorage.getItem(CURRENT_USER_KEY);
  if (!item) return null;
  try {
    return JSON.parse(item) as User;
  } catch {
    return null;
  }
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
