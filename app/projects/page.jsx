'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function ProjectsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingMemberIds, setEditingMemberIds] = useState([]);
  const [form, setForm] = useState({
    name: '', clientId: '', description: '',
    startDate: '', endDate: '', status: 'active',
    memberIds: [],
  });

  async function loadProjects() {
    setLoading(true);
    try {
      const [pRes, peopleRes, clientsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/people'),
        fetch('/api/clients'),
      ]);
      const [data, peopleData, clientsData] = await Promise.all([
        pRes.json(),
        peopleRes.json(),
        clientsRes.json(),
      ]);
      setProjects(data);
      setPeople(peopleData);
      setClients(clientsData);
    } finally {
      setLoading(false);
    }
  }

  function clientName(p) {
    if (p.clientId && typeof p.clientId === 'object') return p.clientId.name;
    return p.client || '—';
  }

  useEffect(() => {
    if (pathname !== '/projects') return;
    setDataLoaded(false);
    setLoading(true);
    loadProjects();
  }, [pathname]);

  useEffect(() => {
    if (!loading && pathname === '/projects') setDataLoaded(true);
  }, [loading, pathname]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, memberIds: form.memberIds || [], clientId: form.clientId || undefined }),
      });
      setForm({ name: '', clientId: '', description: '', startDate: '', endDate: '', status: 'active', memberIds: [] });
      setFormOpen(false);
      loadProjects();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id, name) {
    if (!confirm(`Remover o projeto "${name}"? Épicos e features vinculados podem ficar órfãos. Esta ação não pode ser desfeita.`)) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      loadProjects();
    } finally {
      setSaving(false);
    }
  }

  async function saveMembers() {
    if (!editingProject) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${editingProject._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: editingMemberIds }),
      });
      setEditingProject(null);
      loadProjects();
    } finally {
      setSaving(false);
    }
  }

  function memberNames(p) {
    const ids = p.memberIds || [];
    return ids.map((m) => (typeof m === 'object' && m?.name ? m.name : '—')).filter(Boolean).join(', ') || '—';
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
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Lista de projetos</h3>
        {(loading || !dataLoaded) ? (
          <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div>
        ) : projects.length === 0 ? (
          <p>Nenhum projeto cadastrado. Use o botão abaixo para cadastrar um projeto.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Cliente</th>
                <th>Membros</th>
                <th>Status</th>
                <th>Início</th>
                <th>Fim previsto</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{clientName(p)}</td>
                  <td style={{ fontSize: 13 }}>{memberNames(p)}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td>{p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</td>
                  <td>{p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setEditingProject(p);
                          setEditingMemberIds((p.memberIds || []).map((m) => (typeof m === 'object' ? m._id : m)));
                        }}
                      >
                        Editar / Membros
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => handleRemove(p._id, p.name)} disabled={saving}>Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {editingProject && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>Membros do projeto: {editingProject.name}</h4>
            <div className="form-group">
              <label>Selecione as pessoas (Ctrl para múltiplos)</label>
              <select
                multiple
                size={8}
                value={editingMemberIds}
                onChange={e => setEditingMemberIds(Array.from(e.target.selectedOptions, (o) => o.value))}
                style={{ minHeight: 120 }}
              >
                {people.map((person) => (
                  <option key={person._id} value={person._id}>{person.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={saveMembers} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar membros'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setEditingProject(null)}>Cancelar</button>
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
          Cadastrar novo projeto
          <span className="chevron">▼</span>
        </button>
        {formOpen && (
          <div className="collapsible-content">
            <div className="collapsible-content-inner">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome do projeto</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Cliente</label>
                  <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required>
                    <option value="">Selecione...</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  {clients.length === 0 && <p style={{ fontSize: 12, color: 'var(--warning)' }}>Cadastre clientes em Clientes.</p>}
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
                <div className="form-group">
                  <label>Pessoas no projeto (opcional)</label>
                  <select
                    multiple
                    size={5}
                    value={form.memberIds || []}
                    onChange={e => setForm({ ...form, memberIds: Array.from(e.target.selectedOptions, (o) => o.value) })}
                    style={{ minHeight: 100 }}
                  >
                    {people.map((person) => (
                      <option key={person._id} value={person._id}>{person.name}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Segure Ctrl para selecionar vários.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar projeto'}
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
