'use client';

import { useEffect, useState } from 'react';

export default function BuildInfo() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch('/build-info.json')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setInfo(data))
      .catch(() => setInfo(null));
  }, []);

  if (!info) return null;

  const date = info.buildTime ? new Date(info.buildTime) : null;
  const dateStr = date ? date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <div
      className="build-info"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        fontSize: 11,
        color: 'var(--text-muted)',
        opacity: 0.85,
        letterSpacing: '0.02em',
      }}
      title={`Versão ${info.version} · Compilado em ${dateStr}`}
    >
      v{info.version} · {dateStr}
    </div>
  );
}
