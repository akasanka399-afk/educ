import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the database specified in config
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Try to enable offline persistence if possible in browser environment
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firebase persistence failed: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firebase persistence not supported');
      }
    });
  } catch {
    // Ignore already enabled or SSR errors
  }
}

// Collections root for schools and cloud sync
export const CLOUD_SYNC_DOC_ID = 'edunova_primary_master_data';

export interface CloudSyncState {
  status: 'offline' | 'connecting' | 'online' | 'error';
  lastSyncedAt: string | null;
  pendingChangesCount: number;
}

export { doc, setDoc, onSnapshot };
