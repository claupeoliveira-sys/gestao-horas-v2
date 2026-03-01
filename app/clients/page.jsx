'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import { useVisibilityRefresh } from '@/app/hooks/useVisibilityRefresh';
import ConfirmModal from '@/app/components/ConfirmModal';
import { safeJson } from '@/lib/safeJson';

export default function ClientsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    contact: '',
    email: '',
    notes: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItemId, setConfirmItemId] = useState(null);
  const [confirmItemName, setConfirmItemName] = useState('');

  useVisibilityRefresh(() => setRefreshKey((k) => k + 1), pathname === '/clients');

  async function loadClients() {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      const data = await safeJson(res, []);
      setClients(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pathname !== '/clients') return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/clients');
        const data = await safeJson(res, []);
        if (!cancelled) setClients(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setClients([]), setError(err?.message || 'Erro ao carregar.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname, refreshKey]);

  function openNew() {
    setEditingId(null);
    setForm({ name: '', contact: '', email: '', notes: '' });
    setFormOpen(true);
  }

  function openEdit(c) {
    setEditingId(c._id);
    setForm({
      name: c.name || '',
      contact: c.contact || '',
      email: c.email || '',
      notes: c.notes || '',
    });
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`/api/clients/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        setEditingId(null);
      } else {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setForm({ name: '', contact: '', email: '', notes: '' });
      setFormOpen(false);
      loadClients();
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmRemove() {
    if (!confirmItemId) return;
    setSaving(true);
    try {
      await fetch(`/api/clients/${confirmItemId}`, { method: 'DELETE' });
      setConfirmOpen(false);
      setConfirmItemId(null);
      setConfirmItemName('');
      if (editingId === confirmItemId) setEditingId(null);
      setFormOpen(false);
      loadClients();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingOverlay message="Aguarde, carregando..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Clientes</h2>
          <p className="page-subtitle">
            Cadastre clientes e vincule projetos a cada um para segmentar o portfólio.
          </p>
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
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Lista de clientes</h3>
        {clients.length === 0 ? (
          <p>Nenhum cliente cadastrado. Use o botão abaixo para cadastrar um cliente.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>E-mail</th>
                <th>Observações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.contact || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td style={{ fontSize: 13 }}>{c.notes ? (c.notes.length > 60 ? c.notes.slice(0, 60) + '…' : c.notes) : '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="btn btn-outline" onClick={() => openEdit(c)}>Editar</button>
                      <button type="button" className="btn btn-danger" onClick={() => { setConfirmItemId(c._id); setConfirmItemName(c.name); setConfirmOpen(true); }} disabled={saving}>Remover</button>
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
          {editingId ? 'Editar cliente' : 'Cadastrar novo cliente'}
        </button>
        {formOpen && (
          <div className="collapsible-content">
            <div className="collapsible-content-inner">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome do cliente *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: '1 1 200px' }}>
                    <label>Contato</label>
                    <input
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: '1 1 200px' }}>
                    <label>E-mail</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Observações</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar cliente'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => { setFormOpen(false); setEditingId(null); }}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirmar exclusão"
        message="Remover o cliente? Esta ação não pode ser desfeita."
        itemName={confirmItemName}
        confirmLabel="Excluir"
        onConfirm={handleConfirmRemove}
        onCancel={() => { setConfirmOpen(false); setConfirmItemId(null); setConfirmItemName(''); }}
        loading={saving}
      />
    </div>
  );
}
