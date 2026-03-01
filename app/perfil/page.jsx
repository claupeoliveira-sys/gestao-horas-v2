'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import { useVisibilityRefresh } from '@/app/hooks/useVisibilityRefresh';
import Link from 'next/link';

export default function PerfilPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [features, setFeatures] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useVisibilityRefresh(() => setRefreshKey((k) => k + 1), pathname === '/perfil');

  function load() {
    setError('');
    setLoading(true);
    let cancelled = false;
    fetch('/api/auth/session', { credentials: 'include' })
      .then((r) => r.json())
      .then((session) => {
        if (cancelled) return;
        if (!session?.user) {
          router.replace('/login');
          setLoading(false);
          return;
        }
        const pid = session.user.personId;
        setUser(session.user);
        return Promise.all([
          fetch('/api/features').then((r) => r.json()),
          fetch('/api/allocations?personId=' + encodeURIComponent(pid)).then((r) => r.json()),
        ]).then(([featuresData, allocationsData]) => {
          if (cancelled) return;
          const myFeatures = (featuresData || []).filter((f) =>
            (f.analystIds || []).some((a) => (typeof a === 'object' ? a?._id : a) === pid)
          );
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const activeAllocations = (allocationsData || []).filter((a) => {
            const end = a.endDate ? new Date(a.endDate) : null;
            return !end || end >= today;
          });
          setFeatures(myFeatures);
          setAllocations(activeAllocations);
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Erro ao carregar dados.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }

  useEffect(() => {
    if (pathname !== '/perfil') return;
    const cancel = load();
    return cancel;
  }, [pathname, refreshKey]);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('A nova senha e a confirmação não conferem.');
      return;
    }
    if (passwordForm.new.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.new }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Erro ao alterar senha');
        return;
      }
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch {
      setPasswordError('Erro de conexão');
    } finally {
      setPasswordSaving(false);
    }
  }

  function getProjectId(ref) {
    return ref && (typeof ref === 'object' ? ref._id : ref);
  }
  function projectName(f) {
    const p = f.projectId;
    return (typeof p === 'object' && p?.name) ? p.name : '—';
  }

  if (loading && !user) return <LoadingOverlay message="Carregando perfil..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Meu perfil</h2>
          <p className="page-subtitle">Suas features atribuídas, alocações ativas e alteração de senha.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>← Voltar</button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--danger)', background: 'var(--bg)' }}>
          <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => { setError(''); load(); }}>Tentar novamente</button>
        </div>
      )}

      {user && (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Dados do usuário</h3>
            <p><strong>Nome:</strong> {user.name || '—'}</p>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Features atribuídas a mim</h3>
            {features.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Nenhuma feature atribuída.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {features.slice(0, 30).map((f) => (
                  <li key={f._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <Link href={`/features?project=${getProjectId(f.projectId)}`} style={{ color: 'var(--primary)' }}>{f.name || f.code}</Link>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>{projectName(f)}</span>
                  </li>
                ))}
              </ul>
            )}
            {features.length > 30 && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>+ {features.length - 30} features. Use a página Features para ver todas.</p>}
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Alocações ativas</h3>
            {allocations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Nenhuma alocação ativa.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {allocations.map((a) => (
                  <li key={a._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 500 }}>{(a.projectId && (typeof a.projectId === 'object' ? a.projectId.name : '—')) || '—'}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>{a.percentual}% · {a.horasPrevistas}h previstas</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Alterar senha</h3>
            <form onSubmit={handleChangePassword}>
              {passwordError && (
                <p style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 14 }}>{passwordError}</p>
              )}
              <div className="form-group">
                <label>Senha atual</label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nova senha</label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirmar nova senha</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                {passwordSaving ? 'Salvando…' : 'Alterar senha'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
