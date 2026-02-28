'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function EpicsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ projectId: '', name: '', description: '', estimatedHours: '' });

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([fetch('/api/projects'), fetch('/api/epics')]);
      const [p, e] = await Promise.all([pRes.json(), eRes.json()]);
      setProjects(p);
      setEpics(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pathname !== '/epics') return;
    loadData();
  }, [pathname]);

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
      loadData();
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
      loadData();
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
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Lista de épicos</h3>
        {loading ? (
          <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div>
        ) : epics.length === 0 ? (
          <p>Nenhum épico cadastrado. Use o botão abaixo para cadastrar um épico.</p>
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
          className="collapsible-trigger"
          aria-expanded={formOpen}
          onClick={() => { setFormOpen(!formOpen); if (!formOpen) openNew(); }}
        >
          {editingId ? 'Editar épico' : 'Cadastrar épico'}
          <span className="chevron">▼</span>
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
