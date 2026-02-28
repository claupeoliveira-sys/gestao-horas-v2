'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const LOG_SOURCE_LABELS = {
  email: 'E-mail',
  meeting: 'Reunião',
  status_report: 'Reunião de Status Report',
};

function StatusReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [features, setFeatures] = useState([]);
  const [projectLogs, setProjectLogs] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [logForms, setLogForms] = useState({});
  const [savingLog, setSavingLog] = useState(null);
  const [diaryExpanded, setDiaryExpanded] = useState({}); // por projectId: true = mostrar formulário

  useEffect(() => {
    const id = searchParams.get('project');
    if (id) setSelectedProject(id);
  }, [searchParams]);

  useEffect(() => {
    if (pathname !== '/status-report') return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [pRes, eRes, fRes, logsRes, allocRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/epics'),
          fetch('/api/features'),
          fetch('/api/project-logs'),
          fetch('/api/allocations'),
        ]);
        const [p, e, f, logs, alloc] = await Promise.all([
          pRes.json(),
          eRes.json(),
          fRes.json(),
          logsRes.json(),
          allocRes.json(),
        ]);
        if (!cancelled) {
          setProjects(p);
          setEpics(e);
          setFeatures(f);
          setProjectLogs(logs);
          setAllocations(alloc);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname]);

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

  function getLogForm(projectId) {
    return (
      logForms[projectId] ?? {
        date: new Date().toISOString().slice(0, 10),
        source: 'status_report',
        content: '',
      }
    );
  }

  function setLogForm(projectId, data) {
    setLogForms((prev) => ({ ...prev, [projectId]: { ...getLogForm(projectId), ...data } }));
  }

  async function submitLog(projectId) {
    const form = getLogForm(projectId);
    if (!form.content.trim()) return;
    setSavingLog(projectId);
    await fetch('/api/project-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        date: form.date,
        source: form.source,
        content: form.content.trim(),
      }),
    });
    const res = await fetch('/api/project-logs');
    const logs = await res.json();
    setProjectLogs(logs);
    setLogForm(projectId, { date: new Date().toISOString().slice(0, 10), source: 'status_report', content: '' });
    setSavingLog(null);
    setDiaryExpanded((prev) => ({ ...prev, [projectId]: false })); // recolhe após incluir (tela para cliente)
  }

  function logsForProject(projectId) {
    return projectLogs.filter((l) => l.projectId === projectId);
  }

  function logSourceBadge(source) {
    const cls =
      source === 'status_report'
        ? 'badge-done'
        : source === 'meeting'
          ? 'badge-paused'
          : 'badge-active';
    return (
      <span className={`badge ${cls}`} style={{ fontSize: 11 }}>
        {LOG_SOURCE_LABELS[source] || source}
      </span>
    );
  }

  function allocationsForProject(projectId) {
    return allocations.filter((a) => (typeof a.projectId === 'object' ? a.projectId?._id : a.projectId) === projectId);
  }

  function clientName(p) {
    if (p.clientId && typeof p.clientId === 'object') return p.clientId.name;
    return p.client || '—';
  }

  function projectAlerts(proj, m) {
    const list = [];
    const members = proj.memberIds || [];
    if (members.length === 0) list.push({ type: 'warning', text: 'Projeto sem membros atribuídos' });
    if (m.total > 0 && m.doneCount / m.total < 0.2 && m.total >= 3) list.push({ type: 'info', text: `${m.total - m.doneCount} tarefas ainda em aberto` });
    if (m.total > 0 && m.totalLogged > m.totalEstimated) list.push({ type: 'danger', text: 'Horas lançadas acima do estimado' });
    if (proj.endDate) {
      const end = new Date(proj.endDate);
      const today = new Date();
      const days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      if (days >= 0 && days <= 14) list.push({ type: 'warning', text: `Prazo em ${days} dias` });
      if (days < 0) list.push({ type: 'danger', text: 'Prazo vencido' });
    }
    return list;
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
            {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({clientName(p)})</option>)}
          </select>
          <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
            ← Voltar
          </button>
        </div>
      </div>

      {loading ? <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div> :
        filteredProjects.length === 0 ? <div className="card"><p>Nenhum projeto encontrado.</p></div> :
        filteredProjects.map(p => {
          const m = metrics(p._id);
          return (
            <div className="card" key={p._id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 20 }}>{p.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cliente: <strong>{clientName(p)}</strong></p>
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

              {projectAlerts(p, m).length > 0 && (
                <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Alertas</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {projectAlerts(p, m).map((a, i) => (
                      <li key={i} style={{ fontSize: 13, marginBottom: 4, color: a.type === 'danger' ? 'var(--danger)' : a.type === 'warning' ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {a.type === 'danger' && '⚠ '}{a.type === 'warning' && '⚡ '}{a.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {allocationsForProject(p._id).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Alocações (vínculo com projeto)</p>
                  <table>
                    <thead>
                      <tr>
                        <th>Pessoa</th>
                        <th>%</th>
                        <th>Horas prev.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocationsForProject(p._id).map((a) => (
                        <tr key={a._id}>
                          <td>{(typeof a.personId === 'object' && a.personId?.name) || '—'}</td>
                          <td>{a.percentual}%</td>
                          <td>{a.horasPrevistas}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

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

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  <h4 style={{ fontSize: 16, margin: 0, color: 'var(--text-muted)' }}>Anotações</h4>
                  {!diaryExpanded[p._id] ? (
                    <button
                      type="button"
                      className="btn btn-add-collapse"
                      aria-expanded={false}
                      onClick={() => setDiaryExpanded((prev) => ({ ...prev, [p._id]: true }))}
                    >
                      <span className="btn-add-icon">+</span>
                      Incluir uma notificação
                    </button>
                  ) : null}
                </div>
                {logsForProject(p._id).length === 0 && !diaryExpanded[p._id] ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma anotação ainda. Clique em &quot;Incluir uma notificação&quot; para adicionar.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {logsForProject(p._id).map((log) => (
                      <li
                        key={log._id}
                        style={{
                          padding: '12px 0',
                          borderBottom: '1px solid var(--border)',
                          fontSize: 14,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 13 }}>
                            {log.date ? new Date(log.date).toLocaleDateString('pt-BR') : '—'}
                          </span>
                          {logSourceBadge(log.source)}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{log.content}</div>
                      </li>
                    ))}
                  </ul>
                )}
                {diaryExpanded[p._id] && (
                  <div className="card" style={{ marginTop: 16, padding: 16, background: 'var(--bg)' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Nova anotação (diário de bordo)</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      <div className="form-group" style={{ flex: '0 1 140px', marginBottom: 0 }}>
                        <label style={{ fontSize: 12 }}>Data</label>
                        <input
                          type="date"
                          value={getLogForm(p._id).date}
                          onChange={(e) => setLogForm(p._id, { date: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ flex: '0 1 200px', marginBottom: 0 }}>
                        <label style={{ fontSize: 12 }}>Origem</label>
                        <select
                          value={getLogForm(p._id).source}
                          onChange={(e) => setLogForm(p._id, { source: e.target.value })}
                        >
                          <option value="status_report">Reunião de Status Report</option>
                          <option value="meeting">Reunião</option>
                          <option value="email">E-mail</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 12 }}>Anotação / acordos / definições</label>
                      <textarea
                        rows={3}
                        value={getLogForm(p._id).content}
                        onChange={(e) => setLogForm(p._id, { content: e.target.value })}
                        placeholder="Ex: Cliente aprovou escopo da fase 2. Próxima reunião em 15/03."
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-primary"
                        type="button"
                        disabled={savingLog === p._id || !getLogForm(p._id).content.trim()}
                        onClick={() => submitLog(p._id)}
                      >
                        {savingLog === p._id ? 'Salvando...' : 'Incluir no diário'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setDiaryExpanded((prev) => ({ ...prev, [p._id]: false }))}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

export default function StatusReportPage() {
  return (
    <Suspense fallback={<div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div>}>
      <StatusReportContent />
    </Suspense>
  );
}
