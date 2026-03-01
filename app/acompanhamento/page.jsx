'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import FilterBox from '@/app/components/FilterBox';

const FEEDBACK_TYPES = {
  positive: 'Positivo',
  performance: 'Desempenho',
  improvement: 'Melhoria',
  situation: 'Situação específica',
  other: 'Outro',
};

const IMPACT_LABELS = { low: 'Baixo', medium: 'Médio', high: 'Alto' };
const FOLLOW_UP_LABELS = { pending: 'Pendente', in_progress: 'Em andamento', done: 'Concluído' };

const TYPE_ICONS = {
  positive: '👍',
  performance: '⭐',
  improvement: '📈',
  situation: '📌',
  other: '📝',
};

export default function AcompanhamentoPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [people, setPeople] = useState([]);
  const [projects, setProjects] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [filterPerson, setFilterPerson] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFollowUp, setFilterFollowUp] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    personId: '',
    projectId: '',
    type: 'other',
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    impactLevel: 'medium',
    followUpStatus: 'pending',
    rating: '',
    followUpDate: '',
    tags: '',
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
    try {
      const params = new URLSearchParams();
      if (filterPerson) params.append('personId', filterPerson);
      if (filterProject) params.append('projectId', filterProject);
      if (filterType) params.append('type', filterType);
      if (filterFollowUp) params.append('followUpStatus', filterFollowUp);
      const res = await fetch('/api/feedbacks?' + params.toString());
      const data = await res.json();
      setFeedbacks(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPeople();
    loadProjects();
  }, []);

  useEffect(() => {
    if (pathname !== '/acompanhamento') return;
    loadPeople();
    loadProjects();
    loadFeedbacks();
  }, [pathname]);

  useEffect(() => {
    loadFeedbacks();
  }, [filterPerson, filterProject, filterType, filterFollowUp]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        projectId: form.projectId || undefined,
        rating: form.rating ? Number(form.rating) : undefined,
        followUpDate: form.followUpDate || undefined,
        tags: form.tags || '',
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
      impactLevel: 'medium',
      followUpStatus: 'pending',
      rating: '',
      followUpDate: '',
      tags: '',
    });
    loadFeedbacks();
  }

  function personName(id) {
    if (!id) return '—';
    if (typeof id === 'object' && id?.name) return id.name;
    return people.find((p) => p._id === id)?.name || '—';
  }

  function projectName(id) {
    if (!id) return '—';
    if (typeof id === 'object' && id?.name) return id.name;
    return projects.find((p) => p._id === id)?.name || '—';
  }

  const showRating = form.type === 'positive' || form.type === 'performance';
  const hasActiveFilters = filterPerson !== '' || filterProject !== '' || filterType !== '' || filterFollowUp !== '';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Acompanhamento de colaboradores</h2>
          <p className="page-subtitle">
            Registre feedbacks e situações específicas. Linha do tempo por colaborador.
          </p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
          ← Voltar
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16, color: 'var(--text)' }}>Novo feedback</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Colaborador *</label>
              <select
                className="filter-select"
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
                className="filter-select"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                <option value="">Nenhum</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 160px' }}>
              <label>Tipo</label>
              <select
                className="filter-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {Object.entries(FEEDBACK_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '0 1 120px' }}>
              <label>Nível de impacto</label>
              <select
                className="filter-select"
                value={form.impactLevel}
                onChange={(e) => setForm({ ...form, impactLevel: e.target.value })}
              >
                {Object.entries(IMPACT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '0 1 140px' }}>
              <label>Follow-up</label>
              <select
                className="filter-select"
                value={form.followUpStatus}
                onChange={(e) => setForm({ ...form, followUpStatus: e.target.value })}
              >
                {Object.entries(FOLLOW_UP_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {showRating && (
              <div className="form-group" style={{ flex: '0 1 100px' }}>
                <label>Nota (1–5)</label>
                <select
                  className="filter-select"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group" style={{ flex: '0 1 140px' }}>
              <label>Data</label>
              <input
                type="date"
                className="filter-input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: '0 1 160px' }}>
              <label>Data follow-up</label>
              <input
                type="date"
                className="filter-input"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Título (opcional)</label>
            <input
              className="filter-input"
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
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--text)',
              }}
            />
          </div>
          <div className="form-group">
            <label>Tags (separadas por vírgula)</label>
            <input
              className="filter-input"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Ex: trimestral, desempenho, meta"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Registrar feedback'}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, margin: 0, color: 'var(--text)' }}>Linha do tempo de feedbacks</h3>
          <FilterBox hasActiveFilters={hasActiveFilters} onClear={() => { setFilterPerson(''); setFilterProject(''); setFilterType(''); setFilterFollowUp(''); }}>
            <select className="filter-select" value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)}>
              <option value="">Todos colaboradores</option>
              {people.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <select className="filter-select" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <option value="">Todos projetos</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Todos os tipos</option>
              {Object.entries(FEEDBACK_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select className="filter-select" value={filterFollowUp} onChange={(e) => setFilterFollowUp(e.target.value)}>
              <option value="">Qualquer follow-up</option>
              {Object.entries(FOLLOW_UP_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </FilterBox>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        ) : feedbacks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum feedback com os filtros selecionados.</p>
        ) : (
          <div className="feedback-timeline">
            {feedbacks.map((f) => {
              const isPending = f.followUpStatus === 'pending';
              const impactClass = f.impactLevel === 'high' ? 'badge-impact-high' : f.impactLevel === 'low' ? 'badge-impact-low' : 'badge-impact-medium';
              const followClass = f.followUpStatus === 'done' ? 'badge-done' : f.followUpStatus === 'in_progress' ? 'badge-paused' : 'badge-follow-pending';
              return (
                <div
                  key={f._id}
                  className="feedback-timeline-item"
                  style={{
                    borderLeft: isPending ? '3px solid var(--warning)' : '3px solid var(--border)',
                    padding: '14px 16px',
                    marginBottom: 12,
                    borderRadius: 'var(--radius-sm)',
                    background: isPending ? 'var(--alert-warning-bg)' : 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 20 }} title={FEEDBACK_TYPES[f.type] || f.type}>
                      {TYPE_ICONS[f.type] || TYPE_ICONS.other}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <strong style={{ color: 'var(--text)' }}>{personName(f.personId)}</strong>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {f.date ? new Date(f.date).toLocaleDateString('pt-BR') : '—'}
                        </span>
                        <span className={`badge ${impactClass}`}>{IMPACT_LABELS[f.impactLevel] || f.impactLevel}</span>
                        <span className={`badge ${followClass}`}>{FOLLOW_UP_LABELS[f.followUpStatus] || f.followUpStatus}</span>
                        {f.rating != null && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nota: {f.rating}/5</span>}
                      </div>
                      {f.title && <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{f.title}</div>}
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{f.description}</p>
                      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                        {projectName(f.projectId) !== '—' && <span>Projeto: {projectName(f.projectId)}</span>}
                        {f.tags && (
                          <span style={{ marginLeft: 8 }}>
                            Tags: {String(f.tags).split(',').map((t) => t.trim()).filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
