'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import FilterBox from '@/app/components/FilterBox';

function generatePassword(length = 12) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + numbers + symbols;
  let p = '';
  p += upper[Math.floor(Math.random() * upper.length)];
  p += lower[Math.floor(Math.random() * lower.length)];
  p += numbers[Math.floor(Math.random() * numbers.length)];
  p += symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = p.length; i < length; i++) p += all[Math.floor(Math.random() * all.length)];
  return p.split('').sort(() => Math.random() - 0.5).join('');
}

export default function PeoplePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [people, setPeople] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [profilePerson, setProfilePerson] = useState(null);
  const [filterActive, setFilterActive] = useState('active');
  const [filterTeamId, setFilterTeamId] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    teamId: '',
    active: true,
    hasLogin: false,
    username: '',
    profileRole: 'user',
    passwordPlain: '',
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
    setGeneratedPassword('');
    setForm({
      name: '',
      email: '',
      role: '',
      teamId: '',
      active: true,
      hasLogin: false,
      username: '',
      profileRole: 'user',
      passwordPlain: '',
    });
    setFormOpen(true);
  }

  function openEdit(p) {
    setEditingId(p._id);
    setProfilePerson(null);
    setGeneratedPassword('');
    const teamId = typeof p.teamId === 'object' ? p.teamId?._id : p.teamId;
    setForm({
      name: p.name || '',
      email: p.email || '',
      role: p.role || '',
      teamId: teamId || '',
      active: p.active !== false,
      hasLogin: p.hasLogin === true,
      username: p.username || '',
      profileRole: p.profileRole || 'user',
      passwordPlain: '',
    });
    setFormOpen(true);
  }

  function generateInitialPassword() {
    const pwd = generatePassword(12);
    setForm((prev) => ({ ...prev, passwordPlain: pwd }));
    setGeneratedPassword(pwd);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        email: form.email || undefined,
        role: form.role || undefined,
        teamId: form.teamId || undefined,
        active: form.active,
        hasLogin: form.hasLogin,
        username: form.hasLogin ? (form.username || undefined) : undefined,
        profileRole: form.hasLogin ? form.profileRole : undefined,
        passwordPlain: form.hasLogin && form.passwordPlain ? form.passwordPlain : undefined,
      };
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
      openNew();
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
      if (profilePerson?._id === id) setProfilePerson(null);
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
          <p className="page-subtitle">Cadastre colaboradores e defina quem terá acesso ao sistema.</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
          ← Voltar
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, margin: 0 }}>Colaboradores</h3>
          <FilterBox>
            <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} style={{ minWidth: 140 }}>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
              <option value="all">Todas</option>
            </select>
            <select value={filterTeamId} onChange={(e) => setFilterTeamId(e.target.value)} style={{ minWidth: 180 }}>
              <option value="">Todos os times</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </FilterBox>
        </div>
        {loading ? (
          <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div>
        ) : people.length === 0 ? (
          <p>Nenhuma pessoa cadastrada. Use o botão abaixo para cadastrar.</p>
        ) : filteredPeople.length === 0 ? (
          <p>Nenhuma pessoa encontrada com os filtros selecionados.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredPeople.map((p) => (
              <div
                key={p._id}
                className="card"
                style={{
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  borderLeft: `4px solid ${p.active !== false ? 'var(--success)' : 'var(--text-muted)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: 16, margin: 0 }}>{p.name}</h4>
                  {p.hasLogin && (
                    <span className="badge badge-active" style={{ fontSize: 10 }}>Acesso</span>
                  )}
                </div>
                {p.email && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{p.email}</p>}
                <p style={{ fontSize: 13, margin: 0 }}>Papel: {p.role || '—'}</p>
                <p style={{ fontSize: 13, margin: 0 }}>Time: {teamName(p)}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  {p.active !== false ? 'Ativo' : 'Inativo'} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '—'}
                </p>
                <div className="table-actions" style={{ marginTop: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => { setProfilePerson(p); setFormOpen(false); }} style={{ fontSize: 12 }}>
                    Ver perfil
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => openEdit(p)} style={{ fontSize: 12 }}>Editar</button>
                  <button type="button" className="btn btn-danger" onClick={() => handleRemove(p._id, p.name)} disabled={saving} style={{ fontSize: 12 }}>Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {profilePerson && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Perfil: {profilePerson.name}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <p><strong>E-mail:</strong> {profilePerson.email || '—'}</p>
            <p><strong>Papel:</strong> {profilePerson.role || '—'}</p>
            <p><strong>Time:</strong> {teamName(profilePerson)}</p>
            <p><strong>Ativo:</strong> {profilePerson.active !== false ? 'Sim' : 'Não'}</p>
            <p><strong>Acesso ao sistema:</strong> {profilePerson.hasLogin ? 'Sim' : 'Não (apenas cadastro)'}</p>
            {profilePerson.hasLogin && (
              <>
                <p><strong>Usuário de login:</strong> {profilePerson.username || '—'}</p>
                <p><strong>Perfil:</strong> {profilePerson.profileRole === 'admin' ? 'Administrador' : 'Usuário'}</p>
              </>
            )}
            <p><strong>Criado em:</strong> {profilePerson.createdAt ? new Date(profilePerson.createdAt).toLocaleString('pt-BR') : '—'}</p>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-outline" onClick={() => openEdit(profilePerson)}>Editar</button>
            <button type="button" className="btn btn-ghost" onClick={() => setProfilePerson(null)}>Fechar</button>
          </div>
        </div>
      )}

      <div className="card">
        <button
          type="button"
          className="btn-add-collapse"
          aria-expanded={formOpen}
          onClick={() => { setFormOpen(!formOpen); if (!formOpen) openNew(); setProfilePerson(null); }}
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
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Papel / Função</label>
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex: Dev, PO, QA..." />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
                    <option value="">Selecione...</option>
                    {teams.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="person-active"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  <label htmlFor="person-active" style={{ marginBottom: 0 }}>Ativo</label>
                </div>

                <div className="form-group" style={{ padding: 12, background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <input
                      type="checkbox"
                      id="person-hasLogin"
                      checked={form.hasLogin}
                      onChange={(e) => setForm({ ...form, hasLogin: e.target.checked, username: e.target.checked ? form.username : '', passwordPlain: '' })}
                    />
                    <label htmlFor="person-hasLogin" style={{ marginBottom: 0 }}>Terá usuário de acesso ao sistema</label>
                  </div>
                  {form.hasLogin && (
                    <>
                      <div className="form-group">
                        <label>Usuário (login)</label>
                        <input
                          value={form.username}
                          onChange={(e) => setForm({ ...form, username: e.target.value })}
                          placeholder="Ex: joao.silva"
                          required={form.hasLogin}
                        />
                      </div>
                      <div className="form-group">
                        <label>Perfil</label>
                        <select value={form.profileRole} onChange={(e) => setForm({ ...form, profileRole: e.target.value })}>
                          <option value="user">Usuário</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      {!editingId && (
                        <div className="form-group">
                          <label>Senha inicial</label>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button type="button" className="btn btn-outline" onClick={generateInitialPassword}>
                              Gerar senha inicial
                            </button>
                            {generatedPassword && (
                              <span style={{ fontSize: 13, padding: 8, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6 }}>
                                {generatedPassword} <small style={{ color: 'var(--warning)' }}>— Copie e envie ao colaborador. Ele trocará no primeiro login.</small>
                              </span>
                            )}
                          </div>
                          {form.passwordPlain && !generatedPassword && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Senha definida (não será exibida novamente).</p>}
                        </div>
                      )}
                      {editingId && (
                        <div className="form-group">
                          <label>Redefinir senha (opcional)</label>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button type="button" className="btn btn-outline" onClick={() => { const pwd = generatePassword(12); setForm((prev) => ({ ...prev, passwordPlain: pwd })); setGeneratedPassword(pwd); }}>
                              Gerar nova senha
                            </button>
                            {(form.passwordPlain || generatedPassword) && (
                              <span style={{ fontSize: 12 }}>{generatedPassword || form.passwordPlain} — Nova senha será aplicada ao salvar.</span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar pessoa'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => { setFormOpen(false); setEditingId(null); setProfilePerson(null); }}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
