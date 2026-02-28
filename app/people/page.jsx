'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function PeoplePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [people, setPeople] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    teamId: '',
  });

  async function loadPeople() {
    setLoading(true);
    try {
      const [res, tRes] = await Promise.all([fetch('/api/people'), fetch('/api/teams')]);
      const [data, teamsData] = await Promise.all([res.json(), tRes.json()]);
      setPeople(data);
      setTeams(teamsData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pathname !== '/people') return;
    loadPeople();
  }, [pathname]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, teamId: form.teamId || undefined }),
    });
    setSaving(false);
    setForm({ name: '', email: '', role: '', teamId: '' });
    loadPeople();
  }

  function teamName(p) {
    if (p.teamId && typeof p.teamId === 'object') return p.teamId.name;
    return p.team || '—';
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Pessoas</h2>
          <p className="page-subtitle">Cadastre os membros dos times e suas funções.</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
          ← Voltar
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Cadastrar pessoa</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Papel / Função</label>
            <input
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              placeholder="Ex: Dev, PO, QA..."
            />
          </div>
          <div className="form-group">
            <label>Time</label>
            <select
              value={form.teamId}
              onChange={e => setForm({ ...form, teamId: e.target.value })}
            >
              <option value="">Selecione...</option>
              {teams.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar pessoa'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Lista de pessoas</h3>
        {loading ? (
          <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div>
        ) : people.length === 0 ? (
          <p>Nenhuma pessoa cadastrada.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Time</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {people.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.email || '-'}</td>
                  <td>{p.role || '-'}</td>
                  <td>{teamName(p)}</td>
                  <td>
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

