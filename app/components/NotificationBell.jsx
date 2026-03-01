'use client';

import { useEffect, useState, useRef } from 'react';
import { buildAlertsFromData } from '@/lib/buildAlerts';

const STORAGE_KEY = 'toolbox_alerts_read';

function getReadIds() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function setReadIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch (_) {}
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIdsState] = useState(() => getReadIds());
  const containerRef = useRef(null);


  function fetchAlerts() {
    setLoading(true);
    return fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => {
        const list = buildAlertsFromData(data.projects || [], data.features || []);
        setAlerts(list);
      })
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (open) fetchAlerts();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const unread = alerts.filter((a) => !readIds.has(a.id));
  const unreadCount = unread.length;

  function markRead(alertId) {
    const next = new Set(readIds);
    next.add(alertId);
    setReadIdsState(next);
    setReadIds(next);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen((v) => !v)}
        title="Alertas"
        aria-label="Ver alertas"
        style={{ padding: 8, position: 'relative' }}
      >
        <span style={{ fontSize: 20 }}>🔔</span>
        {unreadCount > 0 && (
          <span
            className="nav-alert-badge"
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              background: 'var(--danger)',
              color: 'white',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            minWidth: 320,
            maxWidth: 400,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}
        >
          <h3 style={{ fontSize: 16, marginBottom: 12, color: 'var(--text)' }}>Alertas</h3>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</p>
          ) : alerts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhum alerta no momento.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {alerts.map((a) => {
                const isRead = readIds.has(a.id);
                const label = `${a.projectName} — ${a.message}`;
                return (
                  <li
                    key={a.id}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border)',
                      opacity: isRead ? 0.8 : 1,
                      background: isRead ? 'transparent' : 'var(--bg)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span className={`health-dot ${a.type === 'danger' ? 'red' : 'yellow'}`} style={{ flexShrink: 0, marginTop: 4 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14 }}>{label}</span>
                        {!isRead && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ fontSize: 12, marginTop: 4, padding: '2px 8px' }}
                            onClick={() => markRead(a.id)}
                          >
                            Marcar como lido
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
