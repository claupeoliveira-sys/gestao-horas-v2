'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', status: 'backlog' },
  { id: 'in_progress', title: 'Em andamento', status: 'in_progress' },
  { id: 'block_internal', title: 'Imped. interno', status: 'block_internal' },
  { id: 'block_client', title: 'Imped. cliente', status: 'block_client' },
  { id: 'done', title: 'Concluída', status: 'done' },
];

export default function KanbanPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [features, setFeatures] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [infoFeature, setInfoFeature] = useState(null);

  async function loadFeatures() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProject) params.append('projectId', selectedProject);
      const res = await fetch('/api/features?' + params.toString());
      const data = await res.json();
      setFeatures(data);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (_) {
      setProjects([]);
    }
  }

  useEffect(() => {
    if (pathname !== '/kanban') return;
    loadProjects();
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/kanban') return;
    loadFeatures();
  }, [pathname, selectedProject]);

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
            className="btn btn-outline"
            type="button"
            onClick={() => loadFeatures()}
            disabled={loading}
          >
            Atualizar
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => router.back()}
          >
            ← Voltar
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 12, background: 'rgba(37, 99, 235, 0.06)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          As alterações feitas em outras telas (Features, etc.) não atualizam o quadro automaticamente. Use o botão <strong>Atualizar</strong> para buscar os dados mais recentes.
        </p>
      </div>

      {loading ? (
        <div className="card">
          <LoadingSpinner message="Aguarde, carregando..." />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
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
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{f.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                          Analista(s): {analystNames(f)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>Est.: {f.estimatedHours ?? 0}h</span>
                          <span>Lanç.: {f.loggedHours ?? 0}h</span>
                          <span>{f.createdAt ? new Date(f.createdAt).toLocaleDateString('pt-BR') : '—'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setInfoFeature(infoFeature?._id === f._id ? null : f); }}
                        style={{
                          flexShrink: 0,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                        }}
                        title="Ver detalhes"
                      >
                        i
                      </button>
                    </div>
                    {infoFeature?._id === f._id && (
                      <div
                        className="card"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: 8,
                          zIndex: 10,
                          padding: 14,
                          fontSize: 13,
                          boxShadow: 'var(--shadow-lg)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Detalhes da tarefa</div>
                        <p style={{ margin: '4px 0' }}><strong>ID:</strong> {f.code || '—'}</p>
                        <p style={{ margin: '4px 0' }}><strong>Descrição:</strong> {f.description || '—'}</p>
                        <p style={{ margin: '4px 0' }}><strong>História de usuário:</strong> {f.userStory || '—'}</p>
                        <p style={{ margin: '4px 0' }}><strong>Horas est./lanç.:</strong> {f.estimatedHours ?? 0}h / {f.loggedHours ?? 0}h</p>
                        <p style={{ margin: '4px 0' }}><strong>Conclusão:</strong> {f.percentComplete ?? 0}%</p>
                        {(f.attachments && f.attachments.length > 0) && (
                          <p style={{ margin: '4px 0' }}>
                            <strong>Anexos:</strong>{' '}
                            {f.attachments.map((a, i) => (
                              <span key={i}>
                                {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.name || 'Link'}</a> : a.name || '—'}
                                {i < f.attachments.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </p>
                        )}
                        <button type="button" className="btn btn-outline" style={{ marginTop: 10, fontSize: 12 }} onClick={() => setInfoFeature(null)}>Fechar</button>
                      </div>
                    )}
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
