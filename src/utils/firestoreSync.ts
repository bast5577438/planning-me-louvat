/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { User, Location, Reservation, AppSettings, NotificationLog } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Firestore refuse d'écrire un document contenant un champ `undefined` (ex: téléphone
// non renseigné). On retire ces champs avant toute écriture pour éviter un échec silencieux
// qui ferait "disparaître" l'entrée (elle semble ajoutée à l'écran mais n'est jamais sauvegardée).
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const clean = { ...obj };
  Object.keys(clean).forEach((key) => {
    if (clean[key] === undefined) delete clean[key];
  });
  return clean;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Seeds Firestore with default local data if the database is currently empty.
 */
export const seedFirestoreIfEmpty = async (
  defaultUsers: User[],
  defaultLocations: Location[],
  defaultReservations: Reservation[],
  defaultSettings: AppSettings,
  defaultNotifications: NotificationLog[]
) => {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log('Seeding Firestore with default planning data...');
      const batch = writeBatch(db);
      
      defaultUsers.forEach(u => {
        batch.set(doc(db, 'users', u.id), stripUndefined(u));
      });
      defaultLocations.forEach(l => {
        batch.set(doc(db, 'locations', l.id), stripUndefined(l));
      });
      defaultReservations.forEach(r => {
        batch.set(doc(db, 'reservations', r.id), stripUndefined(r));
      });
      batch.set(doc(db, 'settings', 'app_settings'), stripUndefined(defaultSettings));
      defaultNotifications.forEach(n => {
        batch.set(doc(db, 'notifications', n.id), stripUndefined(n));
      });
      
      await batch.commit();
      console.log('Firestore seeding completed successfully.');
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'users');
  }
};

// Real-time listener subscriptions
export const subscribeToUsers = (onUpdate: (users: User[]) => void) => {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const users: User[] = [];
    snapshot.forEach((doc) => {
      users.push(doc.data() as User);
    });
    users.sort((a, b) => a.id.localeCompare(b.id));
    if (users.length > 0) {
      onUpdate(users);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'users');
  });
};

export const subscribeToLocations = (onUpdate: (locations: Location[]) => void) => {
  return onSnapshot(collection(db, 'locations'), (snapshot) => {
    const locations: Location[] = [];
    snapshot.forEach((doc) => {
      locations.push(doc.data() as Location);
    });
    if (locations.length > 0) {
      onUpdate(locations);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'locations');
  });
};

export const subscribeToReservations = (onUpdate: (reservations: Reservation[]) => void) => {
  return onSnapshot(collection(db, 'reservations'), (snapshot) => {
    const reservations: Reservation[] = [];
    snapshot.forEach((doc) => {
      reservations.push(doc.data() as Reservation);
    });
    onUpdate(reservations);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'reservations');
  });
};

export const subscribeToSettings = (onUpdate: (settings: AppSettings) => void) => {
  return onSnapshot(doc(db, 'settings', 'app_settings'), (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as AppSettings);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'settings/app_settings');
  });
};

export const subscribeToNotifications = (onUpdate: (notifications: NotificationLog[]) => void) => {
  return onSnapshot(collection(db, 'notifications'), (snapshot) => {
    const notifications: NotificationLog[] = [];
    snapshot.forEach((doc) => {
      notifications.push(doc.data() as NotificationLog);
    });
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    onUpdate(notifications);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'notifications');
  });
};

// Mutation triggers to update Firestore
export const saveUserToFirestore = async (user: User) => {
  try {
    await setDoc(doc(db, 'users', user.id), stripUndefined(user));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
  }
};

export const deleteUserFromFirestore = async (userId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
  }
};

export const saveLocationToFirestore = async (loc: Location) => {
  try {
    await setDoc(doc(db, 'locations', loc.id), stripUndefined(loc));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `locations/${loc.id}`);
  }
};

export const deleteLocationFromFirestore = async (locId: string) => {
  try {
    await deleteDoc(doc(db, 'locations', locId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `locations/${locId}`);
  }
};

export const saveReservationToFirestore = async (res: Reservation) => {
  try {
    await setDoc(doc(db, 'reservations', res.id), stripUndefined(res));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `reservations/${res.id}`);
  }
};

export const deleteReservationFromFirestore = async (resId: string) => {
  try {
    await deleteDoc(doc(db, 'reservations', resId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `reservations/${resId}`);
  }
};

export const saveSettingsToFirestore = async (settings: AppSettings) => {
  try {
    await setDoc(doc(db, 'settings', 'app_settings'), stripUndefined(settings));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/app_settings');
  }
};

export const saveNotificationToFirestore = async (log: NotificationLog) => {
  try {
    await setDoc(doc(db, 'notifications', log.id), stripUndefined(log));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `notifications/${log.id}`);
  }
};

export const clearNotificationsInFirestore = async (logs: NotificationLog[]) => {
  try {
    const batch = writeBatch(db);
    logs.forEach(l => {
      batch.delete(doc(db, 'notifications', l.id));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'notifications');
  }
};

// NOTE : les suppressions sont calculées par rapport à l'état RÉEL de Firestore
// (lu juste avant l'écriture), jamais par rapport à un ancien état React local.
// Un ancien état React (closure, cache d'un autre onglet/appareil) peut être périmé
// et effacer par erreur des entrées ajoutées entre-temps ailleurs.
export const syncUsersWithFirestore = async (newUsers: User[]) => {
  try {
    const existingSnap = await getDocs(collection(db, 'users'));
    const existingIds = existingSnap.docs.map(d => d.id);
    const newIds = newUsers.map(u => u.id);
    const deletedIds = existingIds.filter(id => !newIds.includes(id));

    const batch = writeBatch(db);
    deletedIds.forEach(id => {
      batch.delete(doc(db, 'users', id));
    });
    newUsers.forEach(u => {
      batch.set(doc(db, 'users', u.id), stripUndefined(u));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'users');
  }
};

export const syncLocationsWithFirestore = async (newLocs: Location[]) => {
  try {
    const existingSnap = await getDocs(collection(db, 'locations'));
    const existingIds = existingSnap.docs.map(d => d.id);
    const newIds = newLocs.map(l => l.id);
    const deletedIds = existingIds.filter(id => !newIds.includes(id));

    const batch = writeBatch(db);
    deletedIds.forEach(id => {
      batch.delete(doc(db, 'locations', id));
    });
    newLocs.forEach(l => {
      batch.set(doc(db, 'locations', l.id), stripUndefined(l));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'locations');
  }
};

export const syncReservationsWithFirestore = async (newRes: Reservation[]) => {
  try {
    const existingSnap = await getDocs(collection(db, 'reservations'));
    const existingIds = existingSnap.docs.map(d => d.id);
    const newIds = newRes.map(r => r.id);
    const deletedIds = existingIds.filter(id => !newIds.includes(id));

    const batch = writeBatch(db);
    deletedIds.forEach(id => {
      batch.delete(doc(db, 'reservations', id));
    });
    newRes.forEach(r => {
      batch.set(doc(db, 'reservations', r.id), stripUndefined(r));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'reservations');
  }
};

