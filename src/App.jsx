import React, { useState, useEffect } from 'react';
import { auth, logoutUser, isFirebaseConfigured } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Auth';
import Counter from './components/Counter';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthChecked(true);
      });
      return () => unsubscribe();
    } else {
      // Allow demo mock logins if firebase is not configured
      setAuthChecked(true);
    }
  }, []);

  const handleLogout = async () => {
    if (isFirebaseConfigured) {
      try {
        await logoutUser();
      } catch (error) {
        console.error("Logout error", error);
      }
    } else {
      setUser(null);
    }
  };

  if (!authChecked) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <div className="app-wrapper">
      {user ? (
        <Counter user={user} onLogout={handleLogout} />
      ) : (
        <Auth onLogin={setUser} />
      )}
    </div>
  );
}

export default App;
