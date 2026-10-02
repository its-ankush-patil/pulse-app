import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from 'firebase/firestore';

// IMPORTANT: Configure Firebase via .env.local using `npm run setup:firebase`
// Alternatively, manually create a .env.local file with these variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

let app, auth, db, provider;

// Helper to check if firebase is configured
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // DBA Optimization: Enable fully robust offline persistence
    // If the user loses connection, taps will be cached and auto-synced later.
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
      } else if (err.code === 'unimplemented') {
        console.warn("Browser doesn't support offline persistence");
      }
    });

    provider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase init error:", error);
  }
}

export const loginWithGoogle = async () => {
  if (!auth) throw new Error("Firebase not configured");
  return signInWithPopup(auth, provider);
};

export const loginAnonymously = async () => {
  if (!auth) throw new Error("Firebase not configured");
  try {
    return await signInAnonymously(auth);
  } catch (error) {
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error("Guest mode is disabled. To fix this, enable 'Anonymous' Sign-In Provider in your Firebase Console.");
    }
    throw error;
  }
};

export const loginWithEmail = async (email, password, isSignUp) => {
  if (!auth) throw new Error("Firebase not configured");
  try {
    if (isSignUp) {
      return await createUserWithEmailAndPassword(auth, email, password);
    } else {
      return await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    // Make error messages more user-friendly
    if (error.code === 'auth/email-already-in-use') throw new Error("An account already exists with this email.");
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') throw new Error("Incorrect email or password.");
    if (error.code === 'auth/weak-password') throw new Error("Password must be at least 6 characters.");
    throw error;
  }
};

export const logoutUser = async () => {
  if (!auth) throw new Error("Firebase not configured");
  return signOut(auth);
};

export { auth, db };
