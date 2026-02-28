'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function FeaturesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [people, setPeople] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedEpic, setSelectedEpic] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ projectId: '', epicId: '', name: '', description: '', estimatedHours: '', userStory: '', analystIds: [] });
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingData, setEditingData] = useState({ loggedHours: '', percentComplete: '', status: 'backlog', details: '', userStory: '', analystIds: [] });
  const [savingEdit, setSavingEdit] = useState(false);
  const [featureHistory, setFeatureHistory] = useState([]);

  async function loadBase() {
    const [pRes, eRes, peopleRes] = await Promise.all([fetch('/api/projects'), fetch('/api/epics'), fetch('/api/people')]);
    const [p, e, peopleList] = await Promise.all([pRes.json(), eRes.json(), peopleRes.json()]);
    setProjects(p);
    setEpics(e);
    setPeople(peopleList);
  }

  async function loadFeatures(filters = {}) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.epicId) params.append('epicId', filters.epicId);
      const res = await fetch('/api/features?' + params.toString());
      setFeatures(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pathname !== '/features') return;
    loadBase().then(() => loadFeatures({ projectId: selectedProject, epicId: selectedEpic }));
  }, [pathname]);
  useEffect(() => { loadFeatures({ projectId: selectedProject, epicId: selectedEpic }); }, [selectedProject, selectedEpic]);

  useEffect(() => {
    if (!editingFeature?._id) { setFeatureHistory([]); return; }
    fetch('/api/feature-history?featureId=' + editingFeature._id)
      .then((r) => r.json())
      .then(setFeatureHistory);
  }, [editingFeature?._id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, estimatedHours: Number(form.estimatedHours || 0), analystIds: form.analystIds || [], userStory: form.userStory || '' }),
      });
      setForm({ projectId: '', epicId: '', name: '', description: '', estimatedHours: '', userStory: '', analystIds: [] });
      setFormOpen(false);
      loadFeatures({ projectId: selectedProject, epicId: selectedEpic });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveFeature(id, name) {
    if (!confirm(`Remover a feature "${name}"? Esta ação não pode ser desfeita.`)) return;
    setSavingEdit(true);
    try {
      await fetch(`/api/features/${id}`, { method: 'DELETE' });
      setEditingFeature(null);
      loadFeatures({ projectId: selectedProject, epicId: selectedEpic });
    } finally {
      setSavingEdit(false);
    }
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
        userStory: editingData.userStory || '',
        analystIds: editingData.analystIds || [],
      }),
    });
    setSavingEdit(false);
    setEditingFeature(null);
    setFeatureHistory([]);
    loadFeatures({ projectId: selectedProject, epicId: selectedEpic });
  }

  function statusLabel(s) {
    return {
      backlog: 'Backlog',
      in_progress: 'Em andamento',
      block_internal: 'Impedimento interno',
      block_client: 'Impedimento cliente',
      done: 'Concluída',
    }[s] || s;
  }

  function analystNames(f) {
    const ids = f.analystIds || [];
    return ids.map((a) => (typeof a === 'object' && a?.name ? a.name : '—')).filter(Boolean).join(', ') || '—';
  }

  function projectMembers(projectId) {
    const proj = projects.find((p) => p._id === projectId);
    const members = proj?.memberIds || [];
    return members.map((m) => (typeof m === 'object' ? m : { _id: m, name: people.find((p) => p._id === m)?.name || '—' }));
  }

  function analystOptionsForForm() {
    if (!form.projectId) return [];
    return projectMembers(form.projectId);
  }

  function analystOptionsForEdit() {
    const projectId = editingFeature?.projectId;
    if (!projectId) return [];
    return projectMembers(typeof projectId === 'object' ? projectId._id : projectId);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Features</h2>
          <p className="page-subtitle">Cadastre, lance horas e acompanhe o progresso.</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
          ← Voltar
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
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

        {loading ? <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div> : features.length === 0 ? <p>Nenhuma feature encontrada. Use o botão abaixo para cadastrar.</p> : (
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Analista(s)</th>
                <th>História / Detalhamento</th>
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
                  <td style={{ fontSize: 13 }}>{analystNames(f)}</td>
                  <td style={{ fontSize: 13, maxWidth: 200 }} title={f.userStory || ''}>
                    {f.userStory ? (f.userStory.length > 50 ? f.userStory.slice(0, 50) + '…' : f.userStory) : '—'}
                  </td>
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
                    <div className="table-actions">
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 12 }}
                        onClick={() => {
                          setEditingFeature(f);
                          const ids = (f.analystIds || []).map((a) => (typeof a === 'object' ? a._id : a));
                          setEditingData({ loggedHours: f.loggedHours ?? 0, percentComplete: f.percentComplete ?? 0, status: f.status || 'backlog', details: f.details || '', userStory: f.userStory || '', analystIds: ids });
                        }}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => handleRemoveFeature(f._id, f.name)} disabled={savingEdit}>Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {editingFeature && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>Editando: {editingFeature.name}</h4>
            {featureHistory.length > 0 && (
              <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Histórico de alterações</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13 }}>
                  {featureHistory.slice(0, 10).map((h) => (
                    <li key={h._id} style={{ marginBottom: 4 }}>
                      {h.details} — {h.createdAt ? new Date(h.createdAt).toLocaleString('pt-BR') : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                  <option value="block_internal">Impedimento interno</option>
                  <option value="block_client">Impedimento cliente</option>
                  <option value="done">Concluída</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Detalhamento / História de usuário</label>
              <textarea
                rows={3}
                value={editingData.userStory}
                onChange={e => setEditingData({ ...editingData, userStory: e.target.value })}
                placeholder="Ex: Como [usuário], quero [ação] para [benefício]..."
              />
            </div>
            <div className="form-group">
              <label>Analista(s) — somente membros do projeto</label>
              <select
                multiple
                size={5}
                value={editingData.analystIds || []}
                onChange={e => setEditingData({ ...editingData, analystIds: Array.from(e.target.selectedOptions, (o) => o.value) })}
                style={{ minHeight: 90 }}
              >
                {analystOptionsForEdit().map((person) => (
                  <option key={person._id} value={person._id}>{person.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Observações / Detalhes</label>
              <textarea rows={3} value={editingData.details} onChange={e => setEditingData({ ...editingData, details: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={saveEdit} disabled={savingEdit}>
                {savingEdit ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setEditingFeature(null)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <button
          type="button"
          className="collapsible-trigger"
          aria-expanded={formOpen}
          onClick={() => setFormOpen(!formOpen)}
        >
          Cadastrar feature
          <span className="chevron">▼</span>
        </button>
        {formOpen && (
          <div className="collapsible-content">
            <div className="collapsible-content-inner">
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
          <div className="form-group">
            <label>Detalhamento / História de usuário (opcional)</label>
            <textarea
              rows={3}
              value={form.userStory}
              onChange={e => setForm({ ...form, userStory: e.target.value })}
              placeholder="Ex: Como [usuário], quero [ação] para [benefício]..."
            />
          </div>
          <div className="form-group">
            <label>Analista(s) — somente membros do projeto</label>
            <select
              multiple
              size={5}
              value={form.analystIds || []}
              onChange={e => setForm({ ...form, analystIds: Array.from(e.target.selectedOptions, (o) => o.value) })}
              style={{ minHeight: 90 }}
            >
              {analystOptionsForForm().map((person) => (
                <option key={person._id} value={person._id}>{person.name}</option>
              ))}
            </select>
            {form.projectId && analystOptionsForForm().length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--warning)' }}>Adicione pessoas ao projeto em Projetos → Editar / Membros.</p>
            )}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Ctrl+clique para múltiplos.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar feature'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>Cancelar</button>
          </div>
        </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
