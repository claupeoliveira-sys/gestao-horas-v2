'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', client: '', description: '',
    startDate: '', endDate: '', status: 'active',
  });
  const [saving, setSaving] = useState(false);

  async function loadProjects() {
    setLoading(true);
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  }

  useEffect(() => { loadProjects(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({ name: '', client: '', description: '', startDate: '', endDate: '', status: 'active' });
    loadProjects();
  }

  function statusBadge(status) {
    const map = {
      active: <span className="badge badge-active">Ativo</span>,
      paused: <span className="badge badge-paused">Pausado</span>,
      finished: <span className="badge badge-done">Concluído</span>,
    };
    return map[status] || null;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Projetos</h2>
          <p className="page-subtitle">Cadastre e acompanhe os projetos ativos.</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
          ← Voltar
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Cadastrar novo projeto</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do projeto</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Cliente</label>
            <input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Data início</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Data fim prevista</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Ativo</option>
                <option value="paused">Pausado</option>
                <option value="finished">Concluído</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar projeto'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Lista de projetos</h3>
        {loading ? <p>Carregando...</p> : projects.length === 0 ? <p>Nenhum projeto cadastrado.</p> : (
          <table>
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Início</th>
                <th>Fim previsto</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.client}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td>{p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</td>
                  <td>{p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
