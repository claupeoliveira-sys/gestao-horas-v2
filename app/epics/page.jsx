'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function EpicsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ projectId: '', name: '', description: '', estimatedHours: '' });

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects');
      const p = await res.json();
      setProjects(p);
    } catch (_) {
      setProjects([]);
    }
  }

  async function loadEpics(projectId) {
    setLoading(true);
    try {
      const res = await fetch('/api/epics?projectId=' + (projectId || ''));
      const e = await res.json();
      setEpics(projectId ? e : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pathname !== '/epics') return;
    loadProjects();
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/epics') return;
    loadEpics(selectedProject);
  }, [pathname, selectedProject]);

  function openNew() {
    setEditingId(null);
    setForm({ projectId: '', name: '', description: '', estimatedHours: '' });
    setFormOpen(true);
  }

  function openEdit(epic) {
    setEditingId(epic._id);
    const projectId = typeof epic.projectId === 'object' ? epic.projectId?._id : epic.projectId;
    setForm({
      projectId: projectId || '',
      name: epic.name || '',
      description: epic.description || '',
      estimatedHours: epic.estimatedHours ?? '',
    });
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, estimatedHours: Number(form.estimatedHours || 0) };
      if (editingId) {
        await fetch(`/api/epics/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        setEditingId(null);
      } else {
        await fetch('/api/epics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      setForm({ projectId: '', name: '', description: '', estimatedHours: '' });
      setFormOpen(false);
      loadEpics(selectedProject);
      loadProjects();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id, name) {
    if (!confirm(`Remover o épico "${name}"? Features vinculadas podem ficar órfãs. Esta ação não pode ser desfeita.`)) return;
    setSaving(true);
    try {
      await fetch(`/api/epics/${id}`, { method: 'DELETE' });
      if (editingId === id) setEditingId(null);
      setFormOpen(false);
      loadEpics(selectedProject);
    } finally {
      setSaving(false);
    }
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, margin: 0 }}>Lista de épicos</h3>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={{ minWidth: 220 }}>
            <option value="">Selecione um projeto...</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name} ({(typeof p.clientId === 'object' && p.clientId?.name) || p.client || '—'})</option>
            ))}
          </select>
        </div>
        {!selectedProject ? (
          <p style={{ color: 'var(--text-muted)' }}>Selecione um projeto acima para listar os épicos disponíveis.</p>
        ) : loading ? (
          <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div>
        ) : epics.length === 0 ? (
          <p>Nenhum épico cadastrado para este projeto. Use o botão abaixo para cadastrar um épico.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Épico</th>
                <th>Projeto</th>
                <th>Horas estimadas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {epics.map(e => (
                <tr key={e._id}>
                  <td>{e.name}</td>
                  <td>{projectName(typeof e.projectId === 'object' ? e.projectId?._id : e.projectId)}</td>
                  <td>{e.estimatedHours ?? 0}h</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-outline" onClick={() => openEdit(e)}>Editar</button>
                      <button type="button" className="btn btn-danger" onClick={() => handleRemove(e._id, e.name)} disabled={saving}>Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <button
          type="button"
          className="btn-add-collapse"
          aria-expanded={formOpen}
          onClick={() => { setFormOpen(!formOpen); if (!formOpen) openNew(); }}
        >
          <span className="btn-add-icon">+</span>
          {editingId ? 'Editar épico' : 'Cadastrar épico'}
        </button>
        {formOpen && (
          <div className="collapsible-content">
            <div className="collapsible-content-inner">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Projeto</label>
                  <select value={form.projectId} onChange={ev => setForm({ ...form, projectId: ev.target.value })} required>
                    <option value="">Selecione...</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({(typeof p.clientId === 'object' && p.clientId?.name) || p.client || '—'})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nome do épico</label>
                  <input value={form.name} onChange={ev => setForm({ ...form, name: ev.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea rows={3} value={form.description} onChange={ev => setForm({ ...form, description: ev.target.value })} />
                </div>
                <div className="form-group">
                  <label>Horas estimadas</label>
                  <input type="number" min="0" step="0.5" value={form.estimatedHours} onChange={ev => setForm({ ...form, estimatedHours: ev.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar épico'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => { setFormOpen(false); setEditingId(null); }}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
