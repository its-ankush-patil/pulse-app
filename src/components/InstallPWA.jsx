import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);

  useEffect(() => {
    const handler = e => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = evt => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
  };

  if (!supportsPWA) {
    return null;
  }

  return (
    <button 
      type="button"
      onClick={onClick} 
      className="action-btn"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'rgba(255, 255, 255, 0.1)', border: '1px solid var(--glass-border)',
        padding: '0.8rem 1rem', borderRadius: '12px', color: 'white',
        cursor: 'pointer', marginBottom: '1rem', width: '100%', justifyContent: 'center'
      }}
    >
      <Download size={16} /> Install App to Home Screen
    </button>
  );
}
