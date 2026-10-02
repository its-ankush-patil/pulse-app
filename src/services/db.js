import { isFirebaseConfigured, db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, runTransaction, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth, deleteUser } from 'firebase/auth';

const LOCAL_STORAGE_KEY = 'chantCounterData';

export const saveCounterData = async (user, currentSession, lifetimeCount, currentStreak, highestStreak) => {
  const isGuest = user.isAnonymous || user.uid.startsWith('guest');
  if (isGuest) return; // Do not persist data for guests

  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // DBA Best Practice Schema: Store metadata alongside the metrics
      // Notice we REMOVED email here to protect PII from the public leaderboard.
      await setDoc(userRef, { 
        uid: user.uid,
        displayName: user.displayName || 'Guest',
        currentSession: currentSession, 
        lifetimeCount: lifetimeCount, 
        currentStreak: currentStreak || 0,
        highestStreak: highestStreak || 0,
        lastActive: new Date() 
      }, { merge: true });
    } catch (e) {
      console.error("Failed to save to firebase", e);
    }
  } else {
    // Fallback to local storage
    const data = getLocalData();
    data[user.uid] = { count: currentSession, totalCount: lifetimeCount, lastUpdated: new Date().toISOString() };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
};

export const getCounterData = async (userId) => {
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        return { 
          count: data.currentSession || 0, 
          totalCount: data.lifetimeCount || 0,
          currentStreak: data.currentStreak || 0,
          highestStreak: data.highestStreak || 0,
          lastActive: data.lastActive ? data.lastActive.toDate() : null,
          username: data.username || '',
          photoURL: data.photoURL || ''
        };
      }
      return { count: 0, totalCount: 0, currentStreak: 0, highestStreak: 0 };
    } catch (e) {
      console.error("Failed to fetch from firebase", e);
      return { count: 0, totalCount: 0 };
    }
  } else {
    // Fallback
    const data = getLocalData();
    if (data[userId]) {
      return data[userId];
    }
    return { count: 0, totalCount: 0 };
  }
};

let leaderboardCache = null;
let leaderboardLastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getLeaderboardData = async (forceRefresh = false) => {
  if (!isFirebaseConfigured || !db) return { data: [], error: "Firebase not configured" };
  
  const now = Date.now();
  // 1. Return Cache if valid (prevents read spam on tab-switching)
  if (!forceRefresh && leaderboardCache && (now - leaderboardLastFetch < CACHE_TTL)) {
    return { data: leaderboardCache, error: null };
  }

  try {
    const q = query(collection(db, 'users'), orderBy('lifetimeCount', 'desc'), limit(50));
    const snap = await getDocs(q);
    const data = snap.docs.map(doc => doc.data());
    
    // 2. Update Cache
    leaderboardCache = data;
    leaderboardLastFetch = now;
    
    return { data, error: null };
  } catch (e) {
    console.error("Failed to fetch leaderboard", e);
    // 3. Stale-While-Revalidate Fallback (If offline or rate-limited, serve stale data)
    if (leaderboardCache) {
      return { data: leaderboardCache, error: null };
    }
    return { data: [], error: e.message };
  }
};

export const updateProfile = async (uid, currentUsername, newUsername, newPhotoURL) => {
  if (!isFirebaseConfigured || !db) return { success: false, error: "Database offline" };
  
  try {
    await runTransaction(db, async (transaction) => {
      // 1. If changing username, check availability atomically
      if (newUsername && newUsername !== currentUsername) {
        const newUsernameRef = doc(db, 'usernames', newUsername.toLowerCase());
        const newUsernameSnap = await transaction.get(newUsernameRef);
        
        if (newUsernameSnap.exists()) {
          throw new Error("Username is already taken");
        }
        
        // Claim the new username
        transaction.set(newUsernameRef, { uid });
        
        // Release the old username if they had one
        if (currentUsername) {
          const oldUsernameRef = doc(db, 'usernames', currentUsername.toLowerCase());
          transaction.delete(oldUsernameRef);
        }
      }
      
      // 2. Update the main user document
      const userRef = doc(db, 'users', uid);
      const updates = {};
      if (newUsername) updates.username = newUsername;
      if (newPhotoURL) updates.photoURL = newPhotoURL;
      
      transaction.set(userRef, updates, { merge: true });
    });
    return { success: true };
  } catch (e) {
    console.error("Profile update failed:", e);
    return { success: false, error: e.message };
  }
};

function getLocalData() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }
  return {};
}

// Required by App Store Guidelines (5.1.1)
export const deleteUserAccount = async (user) => {
  if (!isFirebaseConfigured || !db) return { success: false, error: "Database offline" };
  try {
    // 1. Check if user has a claimed username and release it
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.username) {
        const usernameRef = doc(db, 'usernames', data.username.toLowerCase());
        await deleteDoc(usernameRef);
      }
    }
    // 2. Delete public user document
    await deleteDoc(userRef);
    // 3. Delete Firebase Auth account
    await deleteUser(user);
    
    return { success: true };
  } catch (e) {
    console.error("Delete account error:", e);
    // Check if error is due to requires-recent-login
    if (e.code === 'auth/requires-recent-login') {
      return { success: false, error: 'Please sign out and sign back in to verify your identity before deleting your account.' };
    }
    return { success: false, error: e.message };
  }
};
