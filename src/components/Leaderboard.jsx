import React, { useState, useEffect } from 'react';
import { getLeaderboardData } from '../services/db';
import { Trophy, Medal, Loader, Flag } from 'lucide-react';
import './Leaderboard.css';

export default function Leaderboard({ currentUser }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [hiddenUsers, setHiddenUsers] = useState(() => {
    return JSON.parse(localStorage.getItem('hiddenUsers') || '[]');
  });

  const handleFlag = (uid, e) => {
    e.stopPropagation();
    if (window.confirm("Flag this user for inappropriate content? They will be hidden from your view.")) {
      const newHidden = [...hiddenUsers, uid];
      setHiddenUsers(newHidden);
      localStorage.setItem('hiddenUsers', JSON.stringify(newHidden));
    }
  };

  useEffect(() => {
    const fetchLeaders = async () => {
      const result = await getLeaderboardData();
      if (result.error) {
        setDbError(result.error);
      } else {
        setLeaders(result.data);
      }
      setLoading(false);
    };
    fetchLeaders();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Medal size={20} color="#FFD700" />; // Gold
    if (index === 1) return <Medal size={20} color="#C0C0C0" />; // Silver
    if (index === 2) return <Medal size={20} color="#CD7F32" />; // Bronze
    return <span className="rank-number">#{index + 1}</span>;
  };

  return (
    <div className="tab-content leaderboard-content">
      <header className="tab-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.5rem' }}>
          <Trophy color="var(--accent-1)" /> Global Rankings
        </h2>
      </header>

      {loading ? (
        <div className="leaderboard-loading" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <Loader className="spin" size={32} color="var(--accent-1)" />
        </div>
      ) : dbError ? (
        <div className="empty-state" style={{ color: '#fca5a5', padding: '2rem', textAlign: 'center' }}>
          <p><strong>Database Connection Error</strong></p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{dbError}</p>
          <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
            (If this says "Missing or insufficient permissions", you need to update your Firestore Rules in the Firebase Console).
          </p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaders.filter(l => !hiddenUsers.includes(l.uid)).map((leader, index) => {
            const isMe = leader.uid === currentUser.uid;
            const displayUsername = leader.username ? `@${leader.username}` : (leader.displayName || 'Yogi');
            const displayAvatar = leader.photoURL || `https://ui-avatars.com/api/?name=${leader.displayName}`;

            return (
              <div key={leader.uid} className={`leaderboard-row ${isMe ? 'is-me' : ''}`}>
                <div className="rank-col">
                  {getRankIcon(index)}
                </div>
                <img src={displayAvatar} alt="avatar" className="leader-avatar" />
                <div className="leader-details">
                  <span className="leader-name">{displayUsername}</span>
                  {isMe && <span className="me-badge">YOU</span>}
                </div>
                <div className="leader-score" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {leader.lifetimeCount?.toLocaleString()}
                  {!isMe && (
                    <button 
                      onClick={(e) => handleFlag(leader.uid, e)} 
                      title="Report User"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Flag size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {leaders.length === 0 && (
            <div className="empty-state" style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
              No chanters found yet!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
