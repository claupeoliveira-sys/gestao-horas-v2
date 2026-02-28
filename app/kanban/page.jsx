'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', status: 'backlog' },
  { id: 'in_progress', title: 'Em andamento', status: 'in_progress' },
  { id: 'done', title: 'Concluída', status: 'done' },
];

export default function KanbanPage() {
  const router = useRouter();
  const [features, setFeatures] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  async function loadFeatures() {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedProject) params.append('projectId', selectedProject);
    const res = await fetch('/api/features?' + params.toString());
    const data = await res.json();
    setFeatures(data);
    setLoading(false);
  }

  async function loadProjects() {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadFeatures();
  }, [selectedProject]);

  function analystNames(f) {
    const ids = f.analystIds || [];
    return ids
      .map((a) => (typeof a === 'object' && a?.name ? a.name : '—'))
      .filter((n) => n !== '—')
      .join(', ') || '—';
  }

  function featuresByStatus(status) {
    return features.filter((f) => (f.status || 'backlog') === status);
  }

  async function moveCard(featureId, newStatus) {
    const f = features.find((x) => x._id === featureId);
    if (!f || (f.status || 'backlog') === newStatus) return;
    setUpdatingId(featureId);
    await fetch(`/api/features/${featureId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setFeatures((prev) =>
      prev.map((x) => (x._id === featureId ? { ...x, status: newStatus } : x))
    );
    setUpdatingId(null);
  }

  function handleDragStart(e, feature) {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ id: feature._id, status: feature.status || 'backlog' })
    );
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('kanban-column-drag-over');
  }

  function handleDragLeave(e) {
    e.currentTarget.classList.remove('kanban-column-drag-over');
  }

  function handleDrop(e, columnStatus) {
    e.preventDefault();
    e.currentTarget.classList.remove('kanban-column-drag-over');
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.status !== columnStatus) moveCard(data.id, columnStatus);
    } catch (_) {}
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="page-title">Quadro Kanban</h2>
          <p className="page-subtitle">
            Tarefas em aberto por status. Arraste o card para outra coluna para atualizar.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            style={{ minWidth: 200 }}
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Todos os projetos</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => router.back()}
          >
            ← Voltar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <p>Carregando...</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            minHeight: 400,
          }}
          className="kanban-board"
        >
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              data-status={col.status}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              style={{
                background: 'var(--bg)',
                borderRadius: 'var(--radius)',
                border: '2px dashed var(--border)',
                padding: 16,
                minHeight: 320,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 12,
                  fontSize: 14,
                  color: 'var(--text-muted)',
                }}
              >
                {col.title}{' '}
                <span style={{ fontWeight: 400 }}>
                  ({featuresByStatus(col.status).length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {featuresByStatus(col.status).map((f) => (
                  <div
                    key={f._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, f)}
                    className="card"
                    style={{
                      padding: 12,
                      cursor: updatingId === f._id ? 'wait' : 'grab',
                      opacity: updatingId === f._id ? 0.8 : 1,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Analista(s): {analystNames(f)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        display: 'flex',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>Est.: {f.estimatedHours ?? 0}h</span>
                      <span>Lanç.: {f.loggedHours ?? 0}h</span>
                      <span>
                        {f.createdAt
                          ? new Date(f.createdAt).toLocaleDateString('pt-BR')
                          : '—'}
                      </span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <select
                        style={{ fontSize: 12, padding: '4px 8px' }}
                        value={f.status || 'backlog'}
                        onChange={(e) => moveCard(f._id, e.target.value)}
                        disabled={updatingId === f._id}
                      >
                        <option value="backlog">Backlog</option>
                        <option value="in_progress">Em andamento</option>
                        <option value="done">Concluída</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
