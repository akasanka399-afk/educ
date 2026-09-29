import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Utiliser getFirestore direct pour une compatibilité mobile totale (iOS Safari, Android Chrome, WebView, PWA)
export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Nom du document maître et collection de synchronisation
export const CLOUD_SYNC_DOC_ID = 'edunova_primary_master_data';
export const CLOUD_COLLECTION_NAME = 'edunova_data';

export type SyncStatus = 'offline' | 'connecting' | 'syncing' | 'synced' | 'error';

export interface CloudSyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  deviceId: string;
  isRealtimeActive: boolean;
}

export { doc, setDoc, getDoc, getDocs, collection, onSnapshot };
