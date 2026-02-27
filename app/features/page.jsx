'use client';

import { useEffect, useState } from 'react';

export default function FeaturesPage() {
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedEpic, setSelectedEpic] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ projectId: '', epicId: '', name: '', description: '', estimatedHours: '' });
  const [saving, setSaving] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingData, setEditingData] = useState({ loggedHours: '', percentComplete: '', status: 'backlog', details: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadBase() {
    const [pRes, eRes] = await Promise.all([fetch('/api/projects'), fetch('/api/epics')]);
    const [p, e] = await Promise.all([pRes.json(), eRes.json()]);
    setProjects(p);
    setEpics(e);
  }

  async function loadFeatures(filters = {}) {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.epicId) params.append('epicId', filters.epicId);
    const res = await fetch('/api/features?' + params.toString());
    setFeatures(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadBase().then(() => loadFeatures()); }, []);
  useEffect(() => { loadFeatures({ projectId: selectedProject, epicId: selectedEpic }); }, [selectedProject, selectedEpic]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, estimatedHours: Number(form.estimatedHours || 0) }),
    });
    setSaving(false);
    setForm({ projectId: '', epicId: '', name: '', description: '', estimatedHours: '' });
    loadFeatures({ projectId: selectedProject, epicId: selectedEpic });
  }

  async function saveEdit() {
    setSavingEdit(true);
    await fetch(`/api/features/${editingFeature._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loggedHours: Number(editingData.loggedHours || 0),
        percentComplete: Number(editingData.percentComplete || 0),
        status: editingData.status,
        details: editingData.details,
      }),
    });
    setSavingEdit(false);
    setEditingFeature(null);
    loadFeatures({ projectId: selectedProject, epicId: selectedEpic });
  }

  function statusLabel(s) {
    return { backlog: 'Backlog', in_progress: 'Em andamento', done: 'Concluída' }[s] || s;
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Features</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Cadastrar feature</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Projeto</label>
              <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value, epicId: '' })} required>
                <option value="">Selecione...</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Épico</label>
              <select value={form.epicId} onChange={e => setForm({ ...form, epicId: e.target.value })} required>
                <option value="">Selecione...</option>
                {epics.filter(e => !form.projectId || e.projectId === form.projectId).map(e => (
                  <option key={e._id} value={e._id}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Nome da feature</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Horas estimadas</label>
            <input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar feature'}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18 }}>Lista de features</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={selectedProject} onChange={e => { setSelectedProject(e.target.value); setSelectedEpic(''); }}>
              <option value="">Todos projetos</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <select value={selectedEpic} onChange={e => setSelectedEpic(e.target.value)}>
              <option value="">Todos épicos</option>
              {epics.filter(e => !selectedProject || e.projectId === selectedProject).map(e => (
                <option key={e._id} value={e._id}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? <p>Carregando...</p> : features.length === 0 ? <p>Nenhuma feature encontrada.</p> : (
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Horas est.</th>
                <th>Horas lanç.</th>
                <th>Progresso</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {features.map(f => (
                <tr key={f._id}>
                  <td>{f.name}</td>
                  <td>{f.estimatedHours ?? 0}h</td>
                  <td>{f.loggedHours ?? 0}h</td>
                  <td>
                    <div className="progress-bar" style={{ minWidth: 80 }}>
                      <div className="progress-fill" style={{ width: `${f.percentComplete || 0}%` }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.percentComplete || 0}%</span>
                  </td>
                  <td>{statusLabel(f.status)}</td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 12 }}
                      onClick={() => { setEditingFeature(f); setEditingData({ loggedHours: f.loggedHours ?? 0, percentComplete: f.percentComplete ?? 0, status: f.status || 'backlog', details: f.details || '' }); }}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {editingFeature && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>Editando: {editingFeature.name}</h4>
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Horas lançadas</label>
                <input type="number" min="0" step="0.5" value={editingData.loggedHours} onChange={e => setEditingData({ ...editingData, loggedHours: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>% Conclusão</label>
                <input type="number" min="0" max="100" value={editingData.percentComplete} onChange={e => setEditingData({ ...editingData, percentComplete: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Status</label>
                <select value={editingData.status} onChange={e => setEditingData({ ...editingData, status: e.target.value })}>
                  <option value="backlog">Backlog</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="done">Concluída</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Observações / Detalhes</label>
              <textarea rows={3} value={editingData.details} onChange={e => setEditingData({ ...editingData, details: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button className="btn btn-outline" onClick={() => setEditingFeature(null)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
