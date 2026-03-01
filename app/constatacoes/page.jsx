'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import FilterBox from '@/app/components/FilterBox';

const TIPOS = {
  observation: 'Observação',
  risk: 'Risco',
  opportunity: 'Oportunidade',
  other: 'Outro',
};

export default function ConstatacoesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [features, setFeatures] = useState([]);
  const [constatacoes, setConstatacoes] = useState([]);
  const [filterProject, setFilterProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: '',
    epicId: '',
    featureId: '',
    type: 'observation',
    date: new Date().toISOString().slice(0, 10),
  });

  async function loadProjects() {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
  }

  async function loadEpics() {
    const res = await fetch('/api/epics');
    const data = await res.json();
    setEpics(data);
  }

  async function loadFeatures() {
    const res = await fetch('/api/features');
    const data = await res.json();
    setFeatures(data);
  }

  async function loadConstatacoes() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProject) params.append('projectId', filterProject);
      const res = await fetch('/api/constatacoes?' + params.toString());
      const data = await res.json();
      setConstatacoes(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
    loadEpics();
    loadFeatures();
  }, []);

  useEffect(() => {
    if (pathname !== '/constatacoes') return;
    loadProjects();
    loadEpics();
    loadFeatures();
    loadConstatacoes();
  }, [pathname]);

  useEffect(() => {
    loadConstatacoes();
  }, [filterProject]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/constatacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        projectId: form.projectId || undefined,
        epicId: form.epicId || undefined,
        featureId: form.featureId || undefined,
      }),
    });
    setSaving(false);
    setForm({
      title: '',
      description: '',
      projectId: '',
      epicId: '',
      featureId: '',
      type: 'observation',
      date: new Date().toISOString().slice(0, 10),
    });
    loadConstatacoes();
  }

  function projectName(id) {
    if (!id) return '—';
    return projects.find((p) => p._id === id)?.name || '—';
  }

  function epicName(id) {
    if (!id) return '—';
    return epics.find((e) => e._id === id)?.name || '—';
  }

  function featureName(id) {
    if (!id) return '—';
    return features.find((f) => f._id === id)?.name || '—';
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Constatações</h2>
          <p className="page-subtitle">
            Registre observações, riscos e oportunidades. Dados preparados para integração com IA.
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

      <div
        className="card"
        style={{
          marginBottom: 24,
          borderLeft: '4px solid var(--primary)',
          background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.06), transparent)',
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Esta área armazena constatações vinculadas a projetos, épicos ou features. No futuro, esses dados poderão ser analisados por IA para insights e recomendações.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Nova constatação</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="Ex: Atraso na entrega do módulo X"
            />
          </div>
          <div className="form-group">
            <label>Descrição *</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              placeholder="Descreva a constatação em detalhes..."
            />
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 180px' }}>
              <label>Projeto</label>
              <select
                value={form.projectId}
                onChange={(e) =>
                  setForm({ ...form, projectId: e.target.value, epicId: '', featureId: '' })
                }
              >
                <option value="">Nenhum</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 180px' }}>
              <label>Épico</label>
              <select
                value={form.epicId}
                onChange={(e) =>
                  setForm({ ...form, epicId: e.target.value, featureId: '' })
                }
              >
                <option value="">Nenhum</option>
                {epics
                  .filter((e) => !form.projectId || e.projectId === form.projectId)
                  .map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 180px' }}>
              <label>Feature</label>
              <select
                value={form.featureId}
                onChange={(e) => setForm({ ...form, featureId: e.target.value })}
              >
                <option value="">Nenhum</option>
                {features
                  .filter(
                    (f) =>
                      (!form.projectId || f.projectId === form.projectId) &&
                      (!form.epicId || f.epicId === form.epicId)
                  )
                  .map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '0 1 140px' }}>
              <label>Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {Object.entries(TIPOS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '0 1 140px' }}>
              <label>Data</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Registrar constatação'}
          </button>
        </form>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 18, margin: 0 }}>Lista de constatações</h3>
          <FilterBox
            hasActiveFilters={filterProject !== ''}
            onClear={() => setFilterProject('')}
          >
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos os projetos</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FilterBox>
        </div>
        {loading ? (
          <p>Carregando...</p>
        ) : constatacoes.length === 0 ? (
          <p>Nenhuma constatação registrada.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Projeto</th>
                <th>Épico</th>
                <th>Feature</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {constatacoes.map((c) => (
                <tr key={c._id}>
                  <td>
                    {c.date
                      ? new Date(c.date).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td>{c.title}</td>
                  <td>{TIPOS[c.type] || c.type}</td>
                  <td>{projectName(c.projectId)}</td>
                  <td>{epicName(c.epicId)}</td>
                  <td>{featureName(c.featureId)}</td>
                  <td style={{ maxWidth: 260 }}>{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
