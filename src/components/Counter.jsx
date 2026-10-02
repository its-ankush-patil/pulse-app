import React, { useState, useEffect, useRef } from 'react';
import { saveCounterData, getCounterData } from '../services/db';
import { LogOut, RotateCcw, Activity, Check, Edit3, Trophy, Flame, Target, Minus } from 'lucide-react';
import ProfileEditor from './ProfileEditor';
import Leaderboard from './Leaderboard';
import './Counter.css';

export default function Counter({ user, onLogout }) {
  const [count, setCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [lastActive, setLastActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [justClicked, setJustClicked] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [dbData, setDbData] = useState({});
  const [activeTab, setActiveTab] = useState('chant');
  
  const isGuest = user.isAnonymous || user.uid.startsWith('guest');
  
  const wakeLock = useRef(null);
  const [goalInput, setGoalInput] = useState(() => {
    return localStorage.getItem('chantGoal') || '108';
  });
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem('chantGoal');
    return saved ? Number(saved) : 108;
  });

  const handleGoalBlur = () => {
    let newGoal = parseInt(goalInput, 10);
    if (isNaN(newGoal) || newGoal < 1) newGoal = 108; // Fallback
    setGoalInput(newGoal.toString());
    setGoal(newGoal);
    localStorage.setItem('chantGoal', newGoal.toString());
  };

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && !wakeLock.current) {
        wakeLock.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      // Intentionally swallow (e.g. low battery prevents wake lock)
    }
  };

  useEffect(() => {
    return () => {
      if (wakeLock.current !== null) {
        wakeLock.current.release();
        wakeLock.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getCounterData(user.uid);
      setDbData(data);
      setCount(data.currentSession || data.count || 0); // fallback for old schema
      setTotalCount(data.lifetimeCount || data.totalCount || 0);
      setStreak(data.currentStreak || 0);
      setHighestStreak(data.highestStreak || 0);
      setLastActive(data.lastActive);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // DBA Optimization: Debounced Cloud Saves
  // Instead of writing to the DB on every single tap (which burns quotas),
  // we wait until the user pauses for 1 second before saving to the cloud.
  useEffect(() => {
    if (loading) return; // Don't save during initial load
    
    const timeoutId = setTimeout(() => {
      saveCounterData(user, count, totalCount, streak, highestStreak);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [count, totalCount, streak, highestStreak, user, loading]);

  const handleChant = () => {
    const now = Date.now();
    if (now - lastTapTime < 50) return; // App Store UAT: Prevent macro/multitap freezing (>20 taps/sec)
    setLastTapTime(now);

    requestWakeLock();
    
    const newCount = count + 1;
    const newTotal = totalCount + 1;
    
    // 2. Trigger Apple-tier Haptics
    if (window.navigator && window.navigator.vibrate) {
      if (newCount > 0 && newCount % goal === 0) {
        window.navigator.vibrate([30, 50, 30]); // Milestone pattern
      } else {
        window.navigator.vibrate(15); // Standard tap
      }
    }

    // 3. Process Streak Logic
    let newStreak = streak;
    let newHighest = highestStreak;
    const todayStr = new Date().toDateString();
    
    if (!lastActive || lastActive.toDateString() !== todayStr) {
      if (lastActive) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastActive.toDateString() === yesterday.toDateString()) {
          newStreak += 1;
        } else {
          newStreak = 1; // Broken streak, restart
        }
      } else {
        newStreak = 1;
      }
      if (newStreak > newHighest) newHighest = newStreak;
      
      setStreak(newStreak);
      setHighestStreak(newHighest);
      setLastActive(new Date());
    }

    setCount(newCount);
    setTotalCount(newTotal);
    
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 150);
    
    // Clear reset confirmation if they continue tapping
    if (resetConfirm) setResetConfirm(false); 
  };

  const handleResetClick = () => {
    if (resetConfirm) {
      setCount(0);
      // Force an immediate save on reset
      saveCounterData(user, 0, totalCount, streak, highestStreak);
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000); // Revert back after 3 seconds
    }
  };

  const handleUndo = () => {
    if (count > 0) {
      setCount(prev => prev - 1);
      setTotalCount(prev => prev - 1);
      saveCounterData(user, count - 1, totalCount - 1, streak, highestStreak);
    }
  };

  if (loading) return <div className="app-loading">Loading data...</div>;

  // Milestone logic: Celebration dynamically tied to user's Goal
  const progressRaw = (count % goal) / goal;
  const isMilestone = count > 0 && count % goal === 0;
  const progress = isMilestone ? 1 : progressRaw; 
  
  const circumference = 2 * Math.PI * 140; 
  const strokeDashoffset = circumference - progress * circumference;

  const displayUsername = dbData.username ? `@${dbData.username}` : user.displayName;
  const displayAvatar = dbData.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`;

  return (
    <div className="counter-container">
      <div className="tab-container">
        
        {/* CHANT TAB */}
        <div className={`tab-view ${activeTab === 'chant' ? 'active' : ''}`}>
          <header className="minimal-header" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <span className="lifetime-stat">
              <Activity size={14}/> Lifetime: {totalCount.toLocaleString()}
            </span>
            {streak > 0 && (
              <span className="lifetime-stat" style={{ color: 'var(--accent-3)' }}>
                <Flame size={14}/> Streak: {streak}
              </span>
            )}
          </header>

          <main className="counter-main">
            <div className="goal-selector" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              <Target size={14} color="var(--accent-1)" /> Daily Target:
              <input 
                type="number"
                min="1"
                value={goalInput} 
                onChange={(e) => setGoalInput(e.target.value)}
                onBlur={handleGoalBlur}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGoalBlur(); }}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  color: 'white', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '12px', 
                  padding: '0.3rem 0.6rem', 
                  width: '80px',
                  textAlign: 'center',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontWeight: 600
                }}
              />
            </div>

            <div className="tap-zone-wrapper">
              <svg className="progress-ring" viewBox="0 0 320 320">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-1)" />
                    <stop offset="100%" stopColor="var(--accent-2)" />
                  </linearGradient>
                </defs>
                <circle className="ring-bg" cx="160" cy="160" r="140" />
                <circle 
                  className={`ring-progress ${isMilestone ? 'milestone-complete' : ''}`}
                  cx="160" 
                  cy="160" 
                  r="140" 
                  style={{ 
                    strokeDasharray: circumference, 
                    strokeDashoffset: strokeDashoffset 
                  }} 
                />
              </svg>
              
              <button 
                className={`tap-orb ${justClicked ? 'tapped' : ''} ${isMilestone ? 'milestone-glow' : ''}`}
                onClick={handleChant}
                aria-label="Tap to count"
              >
                <div className="orb-content">
                  <span className="orb-count">{count}</span>
                  <span className="orb-label">{isMilestone ? 'MILESTONE!' : 'TAPS'}</span>
                </div>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
              <button 
                onClick={handleUndo} 
                className="reset-button" 
                aria-label="Undo last tap"
                style={{ padding: '0.8rem', borderRadius: '50%' }}
              >
                <Minus size={16} />
              </button>
              
              <button 
                onClick={handleResetClick} 
                className={`reset-button ${resetConfirm ? 'confirm-mode' : ''}`}
                aria-label={resetConfirm ? "Confirm reset session" : "Reset session"}
              >
                {resetConfirm ? (
                  <><Check size={16} /> Tap again</>
                ) : (
                  <><RotateCcw size={16} /> Reset</>
                )}
              </button>
            </div>
          </main>
        </div>

        {/* RANKING TAB - HIDDEN FOR GUESTS */}
        {!isGuest && (
          <div className={`tab-view ${activeTab === 'ranking' ? 'active' : ''}`}>
            <Leaderboard currentUser={user} />
          </div>
        )}

        {/* PROFILE TAB */}
        <div className={`tab-view ${activeTab === 'profile' ? 'active' : ''}`}>
          <ProfileEditor 
            user={user} 
            dbData={dbData} 
            onSave={(newData) => setDbData({ ...dbData, ...newData })} 
            onLogout={onLogout}
          />
        </div>

      </div>

      <nav className="bottom-nav glass-panel">
        <button className={`nav-item ${activeTab === 'chant' ? 'active' : ''}`} onClick={() => setActiveTab('chant')}>
          <Activity size={24} />
          <span>Chant</span>
        </button>
        
        {!isGuest && (
          <button className={`nav-item ${activeTab === 'ranking' ? 'active' : ''}`} onClick={() => setActiveTab('ranking')}>
            <Trophy size={24} />
            <span>Rankings</span>
          </button>
        )}

        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <img src={displayAvatar} alt="Profile" className="nav-avatar" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
