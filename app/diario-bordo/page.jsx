'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import FilterBox from '@/app/components/FilterBox';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import { useVisibilityRefresh } from '@/app/hooks/useVisibilityRefresh';

const SOURCE_LABELS = {
  email: 'E-mail',
  meeting: 'Reunião',
  status_report: 'Status Report',
  other: 'Outro',
};

export default function DiarioBordoPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    source: 'status_report',
    content: '',
    nextSteps: '',
    decisions: '',
  });

  async function loadProjects() {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
  }

  async function loadLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProject) params.append('projectId', selectedProject);
      const res = await fetch('/api/project-logs?' + params.toString());
      const data = await res.json();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setProjects(data); })
      .catch(() => { if (!cancelled) setProjects([]); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    if (pathname !== '/diario-bordo') return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const params = new URLSearchParams();
        if (selectedProject) params.append('projectId', selectedProject);
        const res = await fetch('/api/project-logs?' + params.toString());
        const data = await res.json();
        if (!cancelled) setLogs(data);
      } catch (err) {
        if (!cancelled) setLogs([]), setError(err?.message || 'Erro ao carregar.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname, selectedProject, refreshKey]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedProject || !form.content.trim()) return;
    setSaving(true);
    await fetch('/api/project-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: selectedProject,
        date: form.date,
        source: form.source,
        content: form.content.trim(),
        nextSteps: form.nextSteps?.trim() || undefined,
        decisions: form.decisions?.trim() || undefined,
      }),
    });
    setForm({
      date: new Date().toISOString().slice(0, 10),
      source: 'status_report',
      content: '',
      nextSteps: '',
      decisions: '',
    });
    loadLogs();
    setSaving(false);
  }

  const filteredLogs = filterSource
    ? logs.filter((l) => l.source === filterSource)
    : logs;
  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  const hasActiveFilters = selectedProject !== '' || filterSource !== '';

  if (loading) return <LoadingOverlay message="Aguarde, carregando..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Diário de Bordo</h2>
          <p className="page-subtitle">
            Registros cronológicos por projeto. Filtre por fonte e adicione novos registros.
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
        <h3 style={{ fontSize: 18, marginBottom: 16, color: 'var(--text)' }}>Novo registro</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Projeto *</label>
              <select
                className="filter-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                required
              >
                <option value="">Selecione um projeto</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {(p.clientId?.name || p.client || '—')} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '0 1 140px' }}>
              <label>Data</label>
              <input
                type="date"
                className="filter-input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: '0 1 180px' }}>
              <label>Fonte</label>
              <select
                className="filter-select"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Conteúdo / Anotação *</label>
            <textarea
              rows={3}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              placeholder="Registro do que foi discutido ou decidido..."
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
          {(form.source === 'status_report' || form.source === 'meeting') && (
            <>
              <div className="form-group">
                <label>Próximos passos</label>
                <textarea
                  rows={2}
                  value={form.nextSteps}
                  onChange={(e) => setForm({ ...form, nextSteps: e.target.value })}
                  placeholder="Próximas ações definidas..."
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
                <label>Decisões tomadas</label>
                <textarea
                  rows={2}
                  value={form.decisions}
                  onChange={(e) => setForm({ ...form, decisions: e.target.value })}
                  placeholder="Decisões registradas..."
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
            </>
          )}
          <button className="btn btn-primary" type="submit" disabled={saving || !form.content.trim()}>
            {saving ? 'Salvando...' : 'Adicionar registro'}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, margin: 0, color: 'var(--text)' }}>Registros consolidados</h3>
          <FilterBox
            hasActiveFilters={hasActiveFilters}
            onClear={() => { setSelectedProject(''); setFilterSource(''); }}
          >
            <select
              className="filter-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">Todos os projetos</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {(p.clientId?.name || p.client || '—')} — {p.name}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="">Todas as fontes</option>
              {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </FilterBox>
        </div>

        {sortedLogs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum registro com os filtros selecionados.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {sortedLogs.map((log) => (
              <li
                key={log._id}
                style={{
                  padding: '14px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 13 }}>
                    {log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '—'}
                  </span>
                  <span className="badge badge-done" style={{ fontSize: 11 }}>
                    {SOURCE_LABELS[log.source] || log.source}
                  </span>
                  {projects.find((x) => x._id === log.projectId) && (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {(projects.find((x) => x._id === log.projectId).clientId?.name || projects.find((x) => x._id === log.projectId).client || '—')} — {projects.find((x) => x._id === log.projectId).name}
                    </span>
                  )}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{log.content}</div>
                {log.nextSteps && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                    <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>Próximos passos:</strong>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{log.nextSteps}</div>
                  </div>
                )}
                {log.decisions && (
                  <div style={{ marginTop: 8 }}>
                    <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>Decisões:</strong>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{log.decisions}</div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
