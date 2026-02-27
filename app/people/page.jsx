'use client';

import { useEffect, useState } from 'react';

export default function PeoplePage() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    team: '',
  });

  async function loadPeople() {
    setLoading(true);
    const res = await fetch('/api/people');
    const data = await res.json();
    setPeople(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPeople();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({ name: '', email: '', role: '', team: '' });
    loadPeople();
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Pessoas</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Cadastrar pessoa</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Papel / Função</label>
            <input
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              placeholder="Ex: Dev, PO, QA..."
            />
          </div>
          <div className="form-group">
            <label>Time (texto livre)</label>
            <input
              value={form.team}
              onChange={e => setForm({ ...form, team: e.target.value })}
              placeholder="Ex: Squad A, Backend..."
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar pessoa'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Lista de pessoas</h3>
        {loading ? (
          <p>Carregando...</p>
        ) : people.length === 0 ? (
          <p>Nenhuma pessoa cadastrada.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
                <th>Time</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {people.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.email || '-'}</td>
                  <td>{p.role || '-'}</td>
                  <td>{p.team || '-'}</td>
                  <td>
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

