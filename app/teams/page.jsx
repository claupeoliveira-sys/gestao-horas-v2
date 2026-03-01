'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import { useVisibilityRefresh } from '@/app/hooks/useVisibilityRefresh';
import ConfirmModal from '@/app/components/ConfirmModal';
import { safeJson } from '@/lib/safeJson';

export default function TeamsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItemId, setConfirmItemId] = useState(null);
  const [confirmItemName, setConfirmItemName] = useState('');

  useVisibilityRefresh(() => setRefreshKey((k) => k + 1), pathname === '/teams');

  async function loadTeams() {
    setLoading(true);
    try {
      const res = await fetch('/api/teams');
      const data = await safeJson(res, []);
      setTeams(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pathname !== '/teams') return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/teams');
        const data = await safeJson(res, []);
        if (!cancelled) setTeams(Array.isArray(data) ? data : []);
      } catch (_) {
        if (!cancelled) setTeams([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname, refreshKey]);

  function openNew() {
    setEditingId(null);
    setForm({ name: '', description: '' });
    setFormOpen(true);
  }

  function openEdit(t) {
    setEditingId(t._id);
    setForm({
      name: t.name || '',
      description: t.description || '',
    });
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`/api/teams/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        setEditingId(null);
      } else {
        await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setForm({ name: '', description: '' });
      setFormOpen(false);
      loadTeams();
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmRemove() {
    if (!confirmItemId) return;
    setSaving(true);
    try {
      await fetch(`/api/teams/${confirmItemId}`, { method: 'DELETE' });
      setConfirmOpen(false);
      setConfirmItemId(null);
      setConfirmItemName('');
      if (editingId === confirmItemId) setEditingId(null);
      setFormOpen(false);
      loadTeams();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingOverlay message="Aguarde, carregando..." />;

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

      {error && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => { setError(''); setRefreshKey((k) => k + 1); }}>Tentar novamente</button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Lista de times</h3>
        {teams.length === 0 ? (
          <p>Nenhum time cadastrado. Use o botão abaixo para cadastrar.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.description || '—'}</td>
                  <td>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-outline" onClick={() => openEdit(t)}>Editar</button>
                      <button type="button" className="btn btn-danger" onClick={() => { setConfirmItemId(t._id); setConfirmItemName(t.name); setConfirmOpen(true); }} disabled={saving}>Remover</button>
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
          {editingId ? 'Editar time' : 'Cadastrar novo time'}
        </button>
        {formOpen && (
          <div className="collapsible-content">
            <div className="collapsible-content-inner">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome do time</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar time'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => { setFormOpen(false); setEditingId(null); }}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirmar exclusão"
        message="Remover o time? Pessoas vinculadas ficarão sem time. Esta ação não pode ser desfeita."
        itemName={confirmItemName}
        confirmLabel="Excluir"
        onConfirm={handleConfirmRemove}
        onCancel={() => { setConfirmOpen(false); setConfirmItemId(null); setConfirmItemName(''); }}
        loading={saving}
      />
    </div>
  );
}
