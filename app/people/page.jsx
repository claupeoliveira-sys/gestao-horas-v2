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
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterActive, setFilterActive] = useState('active'); // 'active' | 'inactive' | 'all'
  const [filterTeamId, setFilterTeamId] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    teamId: '',
    active: true,
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

  function openNew() {
    setEditingId(null);
    setForm({ name: '', email: '', role: '', teamId: '', active: true });
    setFormOpen(true);
  }

  function openEdit(p) {
    setEditingId(p._id);
    const teamId = typeof p.teamId === 'object' ? p.teamId?._id : p.teamId;
    setForm({
      name: p.name || '',
      email: p.email || '',
      role: p.role || '',
      teamId: teamId || '',
      active: p.active !== false,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, teamId: form.teamId || undefined, active: form.active };
      if (editingId) {
        await fetch(`/api/people/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        setEditingId(null);
      } else {
        await fetch('/api/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      setForm({ name: '', email: '', role: '', teamId: '', active: true });
      setFormOpen(false);
      loadPeople();
    } finally {
      setSaving(false);
    }
  }

  const filteredPeople = people.filter((p) => {
    if (filterActive === 'active' && p.active === false) return false;
    if (filterActive === 'inactive' && p.active !== false) return false;
    if (filterTeamId) {
      const tid = typeof p.teamId === 'object' ? p.teamId?._id : p.teamId;
      if (tid !== filterTeamId) return false;
    }
    return true;
  });

  async function handleRemove(id, name) {
    if (!confirm(`Remover a pessoa "${name}"? Ela deixará de aparecer em projetos e features. Esta ação não pode ser desfeita.`)) return;
    setSaving(true);
    try {
      await fetch(`/api/people/${id}`, { method: 'DELETE' });
      if (editingId === id) setEditingId(null);
      setFormOpen(false);
      loadPeople();
    } finally {
      setSaving(false);
    }
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, margin: 0 }}>Lista de pessoas</h3>
          <select value={filterActive} onChange={e => setFilterActive(e.target.value)} style={{ minWidth: 140 }}>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
            <option value="all">Todas</option>
          </select>
          <select value={filterTeamId} onChange={e => setFilterTeamId(e.target.value)} style={{ minWidth: 180 }}>
            <option value="">Todos os times</option>
            {teams.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div>
        ) : people.length === 0 ? (
          <p>Nenhuma pessoa cadastrada. Use o botão abaixo para cadastrar.</p>
        ) : filteredPeople.length === 0 ? (
          <p>Nenhuma pessoa encontrada com os filtros selecionados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Time</th>
                <th>Ativo</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPeople.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.email || '—'}</td>
                  <td>{p.role || '—'}</td>
                  <td>{teamName(p)}</td>
                  <td>{p.active !== false ? <span className="badge badge-active">Sim</span> : <span className="badge badge-paused">Não</span>}</td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-outline" onClick={() => openEdit(p)}>Editar</button>
                      <button type="button" className="btn btn-danger" onClick={() => handleRemove(p._id, p.name)} disabled={saving}>Remover</button>
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
          {editingId ? 'Editar pessoa' : 'Cadastrar nova pessoa'}
        </button>
        {formOpen && (
          <div className="collapsible-content">
            <div className="collapsible-content-inner">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Papel / Função</label>
                  <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Ex: Dev, PO, QA..." />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <select value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })}>
                    <option value="">Selecione...</option>
                    {teams.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="person-active"
                    checked={form.active}
                    onChange={e => setForm({ ...form, active: e.target.checked })}
                  />
                  <label htmlFor="person-active" style={{ marginBottom: 0 }}>Ativo</label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar pessoa'}
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
