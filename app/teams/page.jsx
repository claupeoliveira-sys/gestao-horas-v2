'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  async function loadTeams() {
    setLoading(true);
    const res = await fetch('/api/teams');
    const data = await res.json();
    setTeams(data);
    setLoading(false);
  }

  useEffect(() => {
    loadTeams();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({ name: '', description: '' });
    loadTeams();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Times</h2>
          <p className="page-subtitle">Agrupe pessoas por squads, chapters ou áreas.</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
          ← Voltar
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Cadastrar time</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do time</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar time'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Lista de times</h3>
        {loading ? (
          <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div>
        ) : teams.length === 0 ? (
          <p>Nenhum time cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.description || '-'}</td>
                  <td>
                    {t.createdAt
                      ? new Date(t.createdAt).toLocaleDateString()
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

