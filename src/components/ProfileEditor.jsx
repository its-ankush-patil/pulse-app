import React, { useState } from 'react';
import { updateProfile, deleteUserAccount } from '../services/db';
import { X, Check, Loader, User, LogOut, Trash2 } from 'lucide-react';
import './ProfileEditor.css';
import InstallPWA from './InstallPWA';

// Generate 51 unique, serene avatar URLs using DiceBear 'shapes'
// Matched to the new Apple OLED Teal/Blue aesthetic
const AVATAR_OPTIONS = Array.from({ length: 51 }, (_, i) => 
  `https://api.dicebear.com/9.x/shapes/svg?seed=Mantra${i + 1}&backgroundColor=000000&shape1Color=2DD4BF,3B82F6&shape2Color=2DD4BF,3B82F6`
);

export default function ProfileEditor({ user, dbData, onSave, onLogout }) {
  const [username, setUsername] = useState(dbData.username || '');
  const [photoURL, setPhotoURL] = useState(dbData.photoURL || user.photoURL || AVATAR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    const result = await deleteUserAccount(user);
    if (result.success) {
      onLogout();
    } else {
      setError(result.error);
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    setLoading(true);
    setError('');

    const currentUsername = dbData.username;
    const result = await updateProfile(user.uid, currentUsername, username.trim(), photoURL);

    if (result.success) {
      onSave({ username: username.trim(), photoURL });
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  const isGuest = user.isAnonymous || user.uid.startsWith('guest');

  if (isGuest) {
    return (
      <div className="tab-content profile-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <header className="tab-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Guest Profile</h2>
        </header>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <User size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ marginBottom: '2rem', lineHeight: '1.5' }}>
            You are chanting anonymously.<br/>
            Your data is not synced to the cloud and will be removed when your session closes.
          </p>
          <button 
            type="button" 
            onClick={onLogout} 
            className="action-btn secondary logout-btn" 
            style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center' }}
          >
            <LogOut size={18} style={{ marginRight: '0.5rem' }} /> End Session & Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content profile-content">
      <header className="tab-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Edit Profile</h2>
      </header>

      <form onSubmit={handleSave} className="profile-form">
          <div className="avatar-selection-zone">
            <label>Select an Avatar (51 Options)</label>
            <div className="avatar-grid">
              {AVATAR_OPTIONS.map((url, idx) => (
                <img 
                  key={idx}
                  src={url} 
                  alt={`Avatar ${idx + 1}`} 
                  className={`avatar-option ${photoURL === url ? 'selected' : ''}`}
                  onClick={() => setPhotoURL(url)}
                />
              ))}
            </div>
          </div>

          <div className="input-group">
            <label><User size={14} /> Unique Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => {
                setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase());
                setError('');
              }}
              placeholder="e.g. zen_master_99"
              maxLength={20}
            />
            <small>Only letters, numbers, and underscores.</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className={`action-btn primary ${saved ? 'success' : ''}`} disabled={loading}>
            {loading ? <Loader className="spin" size={16} /> : <Check size={16} />} 
            {loading ? 'Saving...' : saved ? 'Profile Saved!' : 'Save Profile'}
          </button>
          
          <div className="danger-zone" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <InstallPWA />
            <button 
              type="button" 
              onClick={onLogout} 
              className="action-btn secondary logout-btn"
            >
              <LogOut size={16} /> Sign Out
            </button>

            {showDeleteConfirm ? (
              <button 
                type="button" 
                onClick={handleDelete} 
                className="action-btn"
                style={{ background: 'rgba(220,38,38,0.2)', color: '#ef4444' }}
              >
                <Trash2 size={16} /> Tap again to permanently delete
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setShowDeleteConfirm(true)} 
                className="action-btn"
                style={{ background: 'transparent', color: 'var(--text-muted)' }}
              >
                <Trash2 size={16} /> Delete Account
              </button>
            )}
            
            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
               <a href="#" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</a>
            </div>
          </div>
        </form>
    </div>
  );
}
