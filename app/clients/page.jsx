'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contact: '',
    email: '',
    notes: '',
  });

  async function loadClients() {
    setLoading(true);
    const res = await fetch('/api/clients');
    const data = await res.json();
    setClients(data);
    setLoading(false);
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({ name: '', contact: '', email: '', notes: '' });
    loadClients();
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
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Cadastrar cliente</h3>
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
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar cliente'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Lista de clientes</h3>
        {loading ? (
          <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div>
        ) : clients.length === 0 ? (
          <p>Nenhum cliente cadastrado. Cadastre um cliente para depois vincular projetos.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>E-mail</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.contact || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td style={{ fontSize: 13 }}>{c.notes ? (c.notes.length > 60 ? c.notes.slice(0, 60) + '…' : c.notes) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
