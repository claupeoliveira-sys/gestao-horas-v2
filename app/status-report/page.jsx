'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StatusReportPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [features, setFeatures] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pRes, eRes, fRes] = await Promise.all([
        fetch('/api/projects'), fetch('/api/epics'), fetch('/api/features'),
      ]);
      const [p, e, f] = await Promise.all([pRes.json(), eRes.json(), fRes.json()]);
      setProjects(p); setEpics(e); setFeatures(f);
      setLoading(false);
    }
    load();
  }, []);

  const filteredProjects = useMemo(() =>
    selectedProject ? projects.filter(p => p._id === selectedProject) : projects,
    [projects, selectedProject]
  );

  function metrics(projectId) {
    const f = features.filter(f => f.projectId === projectId);
    if (!f.length) return { totalEstimated: 0, totalLogged: 0, avgPercent: 0, doneCount: 0, total: 0 };
    return {
      totalEstimated: f.reduce((s, x) => s + (x.estimatedHours || 0), 0),
      totalLogged: f.reduce((s, x) => s + (x.loggedHours || 0), 0),
      avgPercent: Math.round(f.reduce((s, x) => s + (x.percentComplete || 0), 0) / f.length),
      doneCount: f.filter(x => x.status === 'done').length,
      total: f.length,
    };
  }

  function statusBadge(status) {
    const map = {
      active: <span className="badge badge-active">Ativo</span>,
      paused: <span className="badge badge-paused">Pausado</span>,
      finished: <span className="badge badge-done">Concluído</span>,
    };
    return map[status] || null;
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="page-title">Status Report</h2>
          <p className="page-subtitle">Visão executiva dos projetos e features.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select style={{ minWidth: 220 }} value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="">Todos os projetos</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({p.client})</option>)}
          </select>
          <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
            ← Voltar
          </button>
        </div>
      </div>

      {loading ? <div className="card"><p>Carregando...</p></div> :
        filteredProjects.length === 0 ? <div className="card"><p>Nenhum projeto encontrado.</p></div> :
        filteredProjects.map(p => {
          const m = metrics(p._id);
          return (
            <div className="card" key={p._id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 20 }}>{p.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cliente: <strong>{p.client}</strong></p>
                  {p.description && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{p.description}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {statusBadge(p.status)}
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Início: {p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Fim prev.: {p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                <div style={{ flex: 2 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Progresso geral</p>
                  <div className="progress-bar" style={{ height: 12 }}>
                    <div className="progress-fill" style={{ width: `${m.avgPercent}%` }} />
                  </div>
                  <p style={{ fontSize: 13, marginTop: 4 }}><strong>{m.avgPercent}%</strong> concluído</p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Horas</p>
                  <p style={{ fontSize: 14 }}>Lançadas: <strong>{m.totalLogged.toFixed(1)}h</strong></p>
                  <p style={{ fontSize: 14 }}>Estimadas: <strong>{m.totalEstimated.toFixed(1)}h</strong></p>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Features</p>
                  <p style={{ fontSize: 14 }}>Concluídas: <strong>{m.doneCount}/{m.total}</strong></p>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Épicos</p>
              <table>
                <thead>
                  <tr>
                    <th>Épico</th>
                    <th>Nº features</th>
                    <th>Horas est.</th>
                    <th>% médio</th>
                  </tr>
                </thead>
                <tbody>
                  {epics.filter(e => e.projectId === p._id).map(e => {
                    const fEpic = features.filter(f => f.epicId === e._id);
                    const avg = fEpic.length === 0 ? 0 : Math.round(fEpic.reduce((s, f) => s + (f.percentComplete || 0), 0) / fEpic.length);
                    return (
                      <tr key={e._id}>
                        <td>{e.name}</td>
                        <td>{fEpic.length}</td>
                        <td>{e.estimatedHours ?? 0}h</td>
                        <td>{avg}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })
      }
    </div>
  );
}
