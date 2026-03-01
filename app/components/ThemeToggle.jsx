'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme-preference';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      const next = media.matches ? 'dark' : 'light';
      setTheme(next);
      applyTheme(next);
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      title={theme === 'dark' ? 'Usar modo claro' : 'Usar modo escuro'}
      aria-label={theme === 'dark' ? 'Usar modo claro' : 'Usar modo escuro'}
    >
      {theme === 'dark' ? (
        <span className="theme-icon" aria-hidden>☀️</span>
      ) : (
        <span className="theme-icon" aria-hidden>🌙</span>
      )}
    </button>
  );
}
