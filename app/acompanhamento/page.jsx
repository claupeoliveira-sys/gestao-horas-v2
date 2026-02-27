'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const FEEDBACK_TYPES = {
  positive: 'Positivo',
  improvement: 'Melhoria',
  situation: 'Situação específica',
  other: 'Outro',
};

export default function AcompanhamentoPage() {
  const router = useRouter();
  const [people, setPeople] = useState([]);
  const [projects, setProjects] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    personId: '',
    projectId: '',
    type: 'other',
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  async function loadPeople() {
    const res = await fetch('/api/people');
    const data = await res.json();
    setPeople(data);
  }

  async function loadProjects() {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
  }

  async function loadFeedbacks() {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedPerson) params.append('personId', selectedPerson);
    const res = await fetch('/api/feedbacks?' + params.toString());
    const data = await res.json();
    setFeedbacks(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPeople();
    loadProjects();
  }, []);

  useEffect(() => {
    loadFeedbacks();
  }, [selectedPerson]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        projectId: form.projectId || undefined,
      }),
    });
    setSaving(false);
    setForm({
      personId: '',
      projectId: '',
      type: 'other',
      title: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
    });
    loadFeedbacks();
  }

  function personName(id) {
    return people.find((p) => p._id === id)?.name || '—';
  }

  function projectName(id) {
    if (!id) return '—';
    return projects.find((p) => p._id === id)?.name || '—';
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Acompanhamento de colaboradores</h2>
          <p className="page-subtitle">
            Registre feedbacks e situações específicas ao longo do tempo.
          </p>
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => router.back()}
        >
          ← Voltar
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Novo feedback</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Colaborador *</label>
              <select
                value={form.personId}
                onChange={(e) => setForm({ ...form, personId: e.target.value })}
                required
              >
                <option value="">Selecione...</option>
                {people.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.role ? `(${p.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Projeto (opcional)</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                <option value="">Nenhum</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 160px' }}>
              <label>Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {Object.entries(FEEDBACK_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 140px' }}>
              <label>Data</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Título (opcional)</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Avaliação trimestral"
            />
          </div>
          <div className="form-group">
            <label>Descrição *</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              placeholder="Descreva o feedback ou a situação..."
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Registrar feedback'}
          </button>
        </form>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h3 style={{ fontSize: 18 }}>Histórico de feedbacks</h3>
          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="">Todos os colaboradores</option>
            {people.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <p>Carregando...</p>
        ) : feedbacks.length === 0 ? (
          <p>Nenhum feedback registrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Colaborador</th>
                <th>Projeto</th>
                <th>Tipo</th>
                <th>Título</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((f) => (
                <tr key={f._id}>
                  <td>
                    {f.date
                      ? new Date(f.date).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td>{personName(f.personId)}</td>
                  <td>{projectName(f.projectId)}</td>
                  <td>{FEEDBACK_TYPES[f.type] || f.type}</td>
                  <td>{f.title || '—'}</td>
                  <td style={{ maxWidth: 280 }}>{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
