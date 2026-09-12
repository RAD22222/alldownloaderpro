import { useState, useEffect } from 'react';
import styles from './CookieInput.module.css';

interface CookieInputProps {
  onStatusChange?: (hasCookies: boolean) => void;
}

export default function CookieInput({ onStatusChange }: CookieInputProps) {
  const [showInput, setShowInput] = useState(false);
  const [cookies, setCookies] = useState('');
  const [saved, setSaved] = useState(false);
  const [hasCookies, setHasCookies] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/cookies`)
      .then(r => r.json())
      .then(data => {
        setHasCookies(data.hasCookies);
        onStatusChange?.(data.hasCookies);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!cookies.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/cookies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setHasCookies(true);
        setCookies('');
        onStatusChange?.(true);
        setTimeout(() => { setShowInput(false); setSaved(false); }, 2000);
      }
    } catch {
      alert('Failed to save cookies');
    }
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.toggle}
        onClick={() => setShowInput(!showInput)}
        type="button"
      >
        {hasCookies ? '🍪 YouTube Cookies: Connected' : '🍪 YouTube Cookies (required for YouTube)'}
      </button>

      {showInput && (
        <div className={styles.panel}>
          <p className={styles.help}>
            YouTube requires cookies to download. Export cookies from your browser using{' '}
            <a href="https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc" target="_blank" rel="noreferrer">
              Get cookies.txt
            </a>{' '}
            extension, then paste below:
          </p>
          <textarea
            className={styles.textarea}
            value={cookies}
            onChange={e => setCookies(e.target.value)}
            placeholder={'# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t0\tCONSENT\tYES+1\n...'}
            rows={8}
          />
          <button className={styles.saveBtn} onClick={handleSave} disabled={!cookies.trim()}>
            {saved ? '✅ Saved!' : 'Save Cookies'}
          </button>
        </div>
      )}
    </div>
  );
}
