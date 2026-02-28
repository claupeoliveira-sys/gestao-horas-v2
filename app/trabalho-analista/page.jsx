'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const STATUS_LABEL = {
  backlog: 'Backlog',
  in_progress: 'Em andamento',
  block_internal: 'Imped. interno',
  block_client: 'Imped. cliente',
  done: 'Concluída',
};

function getProjectId(ref) {
  return ref && (typeof ref === 'object' ? ref._id : ref);
}

function getEpicId(ref) {
  return ref && (typeof ref === 'object' ? ref._id : ref);
}

export default function TrabalhoAnalistaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [people, setPeople] = useState([]);
  const [features, setFeatures] = useState([]);
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [selectedAnalyst, setSelectedAnalyst] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname !== '/trabalho-analista') return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [pRes, fRes, projRes, eRes] = await Promise.all([
          fetch('/api/people'),
          fetch('/api/features'),
          fetch('/api/projects'),
          fetch('/api/epics'),
        ]);
        const [peopleList, f, proj, e] = await Promise.all([
          pRes.json(),
          fRes.json(),
          projRes.json(),
          eRes.json(),
        ]);
        if (!cancelled) {
          setPeople(peopleList.filter((x) => x.active !== false));
          setFeatures(f);
          setProjects(proj);
          setEpics(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  const featuresByAnalyst = selectedAnalyst
    ? features.filter((f) =>
        (f.analystIds || []).some((a) => (typeof a === 'object' ? a._id : a) === selectedAnalyst)
      )
    : [];
  const inProgress = featuresByAnalyst.filter((f) => f.status !== 'done');
  const done = featuresByAnalyst.filter((f) => f.status === 'done');

  function projectName(projectId) {
    const id = getProjectId(projectId);
    const p = projects.find((x) => x._id === id);
    return (p && p.name) || '—';
  }

  function epicName(epicId) {
    const id = getEpicId(epicId);
    const e = epics.find((x) => x._id === id);
    return (e && e.name) || '—';
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Trabalho em andamento por analista</h2>
          <p className="page-subtitle">
            Visão das tarefas atribuídas a cada analista (features em que o analista está vinculado).
          </p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
          ← Voltar
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Analista:</label>
          <select
            value={selectedAnalyst}
            onChange={(e) => setSelectedAnalyst(e.target.value)}
            style={{ minWidth: 240 }}
          >
            <option value="">Selecione um analista...</option>
            {people.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div>
        ) : !selectedAnalyst ? (
          <p style={{ color: 'var(--text-muted)' }}>Selecione um analista acima para ver as tarefas atribuídas.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
              <div className="card" style={{ padding: 16, flex: '1 1 120px', margin: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Em andamento</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{inProgress.length}</div>
              </div>
              <div className="card" style={{ padding: 16, flex: '1 1 120px', margin: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Concluídas</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{done.length}</div>
              </div>
            </div>

            {inProgress.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Tarefas em aberto</h4>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Feature</th>
                      <th>Projeto</th>
                      <th>Épico</th>
                      <th>Status</th>
                      <th>Horas</th>
                      <th>Progresso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inProgress.map((f) => (
                      <tr key={f._id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{f.code || '—'}</td>
                        <td>{f.name}</td>
                        <td>{projectName(f.projectId)}</td>
                        <td>{epicName(f.epicId)}</td>
                        <td>{STATUS_LABEL[f.status] || f.status}</td>
                        <td>{f.loggedHours ?? 0}h / {f.estimatedHours ?? 0}h</td>
                        <td>
                          <div className="progress-bar" style={{ minWidth: 60, height: 8 }}>
                            <div className="progress-fill" style={{ width: `${f.percentComplete || 0}%` }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}> {f.percentComplete || 0}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {done.length > 0 && (
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Tarefas concluídas</h4>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Feature</th>
                      <th>Projeto</th>
                      <th>Épico</th>
                      <th>Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {done.map((f) => (
                      <tr key={f._id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{f.code || '—'}</td>
                        <td>{f.name}</td>
                        <td>{projectName(f.projectId)}</td>
                        <td>{epicName(f.epicId)}</td>
                        <td>{f.loggedHours ?? 0}h / {f.estimatedHours ?? 0}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {featuresByAnalyst.length === 0 && selectedAnalyst && (
              <p style={{ color: 'var(--text-muted)' }}>Nenhuma feature atribuída a este analista. Atribua em <Link href="/features" style={{ color: 'var(--primary)' }}>Features</Link> (campo Analista(s)).</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
