import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const isFirebaseConfigValid = firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('PLACEHOLDER');

let app;
if (isFirebaseConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (error) {
    console.error("Firebase initialization failed", error);
  }
}

export const auth = app ? getAuth(app) : null;
export const db = app ? initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)') : null;

export const googleProvider = new GoogleAuthProvider();
export const emailProvider = new EmailAuthProvider();

export { isFirebaseConfigValid };
