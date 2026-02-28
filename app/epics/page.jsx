'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EpicsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ projectId: '', name: '', description: '', estimatedHours: '' });
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const [pRes, eRes] = await Promise.all([fetch('/api/projects'), fetch('/api/epics')]);
    const [p, e] = await Promise.all([pRes.json(), eRes.json()]);
    setProjects(p);
    setEpics(e);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/epics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, estimatedHours: Number(form.estimatedHours || 0) }),
    });
    setSaving(false);
    setForm({ projectId: '', name: '', description: '', estimatedHours: '' });
    loadData();
  }

  function projectName(id) {
    return projects.find(p => p._id === id)?.name || '—';
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Épicos</h2>
          <p className="page-subtitle">Organize grandes blocos de trabalho por projeto.</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
          ← Voltar
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Cadastrar épico</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Projeto</label>
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required>
              <option value="">Selecione...</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({(typeof p.clientId === 'object' && p.clientId?.name) || p.client || '—'})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Nome do épico</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Horas estimadas</label>
            <input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar épico'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Lista de épicos</h3>
        {loading ? <p>Carregando...</p> : epics.length === 0 ? <p>Nenhum épico cadastrado.</p> : (
          <table>
            <thead>
              <tr>
                <th>Épico</th>
                <th>Projeto</th>
                <th>Horas estimadas</th>
              </tr>
            </thead>
            <tbody>
              {epics.map(e => (
                <tr key={e._id}>
                  <td>{e.name}</td>
                  <td>{projectName(e.projectId)}</td>
                  <td>{e.estimatedHours ?? 0}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
