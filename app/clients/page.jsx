'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

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

  async function loadClients() {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pathname !== '/clients') return;
    loadClients();
  }, [pathname]);

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

  async function handleRemove(id, name) {
    if (!confirm(`Remover o cliente "${name}"? Esta ação não pode ser desfeita.`)) return;
    setSaving(true);
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (editingId === id) setEditingId(null);
      setFormOpen(false);
      loadClients();
    } finally {
      setSaving(false);
    }
  }

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

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Lista de clientes</h3>
        {loading ? (
          <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div>
        ) : clients.length === 0 ? (
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
                      <button type="button" className="btn btn-danger" onClick={() => handleRemove(c._id, c.name)} disabled={saving}>Remover</button>
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
          {editingId ? 'Editar cliente' : 'Cadastrar novo cliente'}
          <span className="chevron">▼</span>
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
    </div>
  );
}
