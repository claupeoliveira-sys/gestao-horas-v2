'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);

  async function handleSeedAdmin() {
    setSeedMessage('');
    setSeedLoading(true);
    try {
      const res = await fetch('/api/auth/seed-admin', { method: 'POST' });
      const data = await res.json();
      setSeedMessage(data.message || (data.ok ? 'Admin criado. Use usuário admin e senha admin.' : 'Erro'));
      if (data.ok) {
        setUsername('admin');
        setPassword('admin');
      }
    } catch {
      setSeedMessage('Erro de conexão');
    } finally {
      setSeedLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login');
        return;
      }
      if (data.mustChangePassword) {
        router.replace('/alterar-senha?first=1');
        return;
      }
      router.replace('/');
      router.refresh();
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 360 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>ToolBOX OPS</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>Entre com seu usuário e senha</p>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ marginBottom: 16, padding: 12, background: 'rgba(220,38,38,0.1)', borderRadius: 8, color: 'var(--danger)', fontSize: 14 }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label>Usuário</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
            Primeira instalação?{' '}
            <button type="button" className="btn btn-ghost" onClick={handleSeedAdmin} disabled={seedLoading} style={{ padding: 0, fontSize: 12 }}>
              {seedLoading ? 'Criando...' : 'Criar usuário admin (admin/admin)'}
            </button>
          </p>
          {seedMessage && (
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--success)' }}>{seedMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
}
