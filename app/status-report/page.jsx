'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import FilterBox from '@/app/components/FilterBox';
import { getProjectHealth } from '@/lib/projectHealth';

const LOG_SOURCE_LABELS = {
  email: 'E-mail',
  meeting: 'Reunião',
  status_report: 'Reunião de Status Report',
  other: 'Outro',
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
  const [feedbacks, setFeedbacks] = useState([]);
  const [constatacoes, setConstatacoes] = useState([]);
  const [featureHistory, setFeatureHistory] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [logForms, setLogForms] = useState({});
  const [savingLog, setSavingLog] = useState(null);
  const [diaryExpanded, setDiaryExpanded] = useState({});
  const [exportingPdf, setExportingPdf] = useState(null);

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
        const [pRes, eRes, fRes, logsRes, allocRes, fbRes, constRes, histRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/epics'),
          fetch('/api/features'),
          fetch('/api/project-logs'),
          fetch('/api/allocations'),
          fetch('/api/feedbacks'),
          fetch('/api/constatacoes'),
          fetch('/api/feature-history'),
        ]);
        const [p, e, f, logs, alloc, fb, consta, hist] = await Promise.all([
          pRes.json(),
          eRes.json(),
          fRes.json(),
          logsRes.json(),
          allocRes.json(),
          fbRes.json(),
          constRes.json(),
          histRes.json(),
        ]);
        if (!cancelled) {
          setProjects(p);
          setEpics(e);
          setFeatures(f);
          setProjectLogs(logs);
          setAllocations(alloc);
          setFeedbacks(fb || []);
          setConstatacoes(consta || []);
          setFeatureHistory(hist || []);
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
    const f = features.filter((f) => getProjectId(f.projectId) === projectId);
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
        nextSteps: '',
        decisions: '',
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
        nextSteps: form.nextSteps?.trim() || undefined,
        decisions: form.decisions?.trim() || undefined,
      }),
    });
    const res = await fetch('/api/project-logs');
    const logs = await res.json();
    setProjectLogs(logs);
    setLogForm(projectId, { date: new Date().toISOString().slice(0, 10), source: 'status_report', content: '', nextSteps: '', decisions: '' });
    setSavingLog(null);
    setDiaryExpanded((prev) => ({ ...prev, [projectId]: false })); // recolhe após incluir (tela para cliente)
  }

  function logsForProject(projectId) {
    return projectLogs.filter((l) => (typeof l.projectId === 'object' ? l.projectId?._id : l.projectId) === projectId);
  }

  function lastLogDateForProject(projectId) {
    const list = logsForProject(projectId);
    if (!list.length) return null;
    const dates = list.map((l) => (l.date && new Date(l.date)) || (l.createdAt && new Date(l.createdAt))).filter(Boolean);
    return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
  }

  function projectHealthIndicator(p) {
    const m = metrics(p._id);
    const lastLog = lastLogDateForProject(p._id);
    return getProjectHealth(p, { estimated: m.totalEstimated, logged: m.totalLogged, blocked: featuresForProject(p._id).filter((f) => f.status === 'block_internal' || f.status === 'block_client').length }, lastLog);
  }

  function unifiedTimeline(projectId) {
    const pid = (id) => id && (typeof id === 'object' ? id._id : id);
    const items = [];
    logsForProject(projectId).forEach((log) => {
      items.push({
        date: log.date || log.createdAt,
        type: 'log',
        label: LOG_SOURCE_LABELS[log.source] || log.source,
        detail: log.content,
        id: log._id,
      });
    });
    feedbacks.filter((fb) => pid(fb.projectId) === projectId).forEach((fb) => {
      items.push({
        date: fb.date || fb.createdAt,
        type: 'feedback',
        label: 'Feedback',
        detail: fb.title ? `${fb.title}: ${fb.description}` : fb.description,
        id: fb._id,
      });
    });
    constatacoes.filter((c) => pid(c.projectId) === projectId).forEach((c) => {
      items.push({
        date: c.date || c.createdAt,
        type: 'constatacao',
        label: c.type === 'risk' ? 'Risco' : c.type === 'opportunity' ? 'Oportunidade' : 'Observação',
        detail: c.title ? `${c.title}: ${c.description}` : c.description,
        id: c._id,
      });
    });
    const featureIds = new Set(featuresForProject(projectId).map((f) => f._id));
    featureHistory.filter((h) => featureIds.has(pid(h.featureId))).forEach((h) => {
      if (h.action === 'status_change' && h.details) {
        items.push({
          date: h.createdAt,
          type: 'status_change',
          label: 'Mudança de status',
          detail: h.details,
          id: h._id,
        });
      }
    });
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    return items;
  }

  async function exportProjectPdf(projectId) {
    setExportingPdf(projectId);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const el = document.getElementById(`report-card-${projectId}`);
      if (!el) return;
      await html2pdf().set({
        margin: 10,
        filename: `status-report-${projectId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save();
    } finally {
      setExportingPdf(null);
    }
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

  function getProjectId(ref) {
    return ref && (typeof ref === 'object' ? ref._id : ref);
  }
  function getEpicId(ref) {
    return ref && (typeof ref === 'object' ? ref._id : ref);
  }
  function featuresForProject(projectId) {
    return features.filter((f) => getProjectId(f.projectId) === projectId);
  }
  function featuresForEpic(projectId, epicId) {
    return featuresForProject(projectId).filter((f) => getEpicId(f.epicId) === epicId);
  }
  function analystNames(f) {
    const ids = f.analystIds || [];
    return ids.map((a) => (typeof a === 'object' && a?.name ? a.name : '—')).filter(Boolean).join(', ') || '—';
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
        <FilterBox
          hasActiveFilters={selectedProject !== ''}
          onClear={() => setSelectedProject('')}
        >
          <select className="filter-select" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="">Todos os projetos</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name} ({clientName(p)})</option>)}
          </select>
          <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
            ← Voltar
          </button>
        </FilterBox>
      </div>

      {loading ? <div className="card"><LoadingSpinner message="Aguarde, carregando..." /></div> :
        filteredProjects.length === 0 ? <div className="card"><p>Nenhum projeto encontrado.</p></div> :
        filteredProjects.map(p => {
          const m = metrics(p._id);
          const timeline = unifiedTimeline(p._id);
          return (
            <div id={`report-card-${p._id}`} className="card" key={p._id} style={{ marginBottom: 16, borderLeft: `4px solid ${projectHealthIndicator(p) === 'red' ? 'var(--danger)' : projectHealthIndicator(p) === 'yellow' ? 'var(--warning)' : 'var(--success)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`health-dot ${projectHealthIndicator(p)}`} />
                    <h3 style={{ fontSize: 20, margin: 0 }}>{p.name}</h3>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cliente: <strong>{clientName(p)}</strong></p>
                  {p.description && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{p.description}</p>}
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => exportProjectPdf(p._id)}
                    disabled={exportingPdf === p._id}
                  >
                    {exportingPdf === p._id ? 'Exportando...' : 'Exportar PDF'}
                  </button>
                  {statusBadge(p.status)}
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Início: {p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Fim prev.: {p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}</p>
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

              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Épicos e tarefas</p>
              {epics.filter((e) => (typeof e.projectId === 'object' ? e.projectId?._id : e.projectId) === p._id).map((e) => {
                const fEpic = featuresForEpic(p._id, e._id);
                const epicEst = fEpic.reduce((s, f) => s + (Number(f.estimatedHours) || 0), 0);
                const epicLog = fEpic.reduce((s, f) => s + (Number(f.loggedHours) || 0), 0);
                const avg = fEpic.length === 0 ? 0 : Math.round(fEpic.reduce((s, f) => s + (f.percentComplete || 0), 0) / fEpic.length);
                return (
                  <div key={e._id} style={{ marginBottom: 20, padding: 16, background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <strong style={{ fontSize: 14 }}>Épico: {e.name}</strong>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fEpic.length} tarefa(s) · {epicEst}h est. · {epicLog}h lanç. · {avg}% médio</span>
                    </div>
                    {fEpic.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Nenhuma tarefa neste épico.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {fEpic.map((f) => {
                          const overHours = (Number(f.loggedHours) || 0) > (Number(f.estimatedHours) || 0);
                          return (
                            <li key={f._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                  <span style={{ fontFamily: 'monospace', marginRight: 8 }}>{f.code || '—'}</span>
                                  <strong>{f.name}</strong>
                                  <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>Executante(s): {analystNames(f)}</div>
                                </div>
                                <div style={{ minWidth: 120, textAlign: 'right' }}>
                                  <div style={{ marginBottom: 4 }}>
                                    <span style={{ color: overHours ? 'var(--danger)' : 'inherit', fontWeight: overHours ? 600 : undefined }}>
                                      {f.loggedHours ?? 0}h / {f.estimatedHours ?? 0}h
                                    </span>
                                    {overHours && <span style={{ marginLeft: 6, color: 'var(--danger)', fontSize: 11 }}>acima do estimado</span>}
                                  </div>
                                  <div className="progress-bar" style={{ height: 6, marginBottom: 2 }}>
                                    <div
                                      className="progress-fill"
                                      style={{
                                        width: `${Math.min(100, ((f.loggedHours || 0) / (f.estimatedHours || 1)) * 100)}%`,
                                        background: overHours ? 'var(--danger)' : undefined,
                                      }}
                                    />
                                  </div>
                                  <div className="progress-bar" style={{ height: 6 }}>
                                    <div className="progress-fill" style={{ width: `${f.percentComplete || 0}%` }} />
                                  </div>
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Conclusão: {f.percentComplete || 0}%</span>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}

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
                {timeline.length > 0 && (
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: 16, margin: '0 0 12px', color: 'var(--text-muted)' }}>Linha do tempo unificada</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {timeline.slice(0, 30).map((item) => (
                        <li key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 13 }}>
                              {item.date ? new Date(item.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                            </span>
                            <span className="badge badge-active" style={{ fontSize: 11 }}>{item.label}</span>
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{item.detail}</div>
                        </li>
                      ))}
                    </ul>
                    {timeline.length > 30 && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>+ {timeline.length - 30} itens.</p>}
                  </div>
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
                          <option value="other">Outro</option>
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
                    {(getLogForm(p._id).source === 'status_report' || getLogForm(p._id).source === 'meeting') && (
                      <>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 12 }}>Próximos passos</label>
                          <textarea
                            rows={2}
                            value={getLogForm(p._id).nextSteps || ''}
                            onChange={(e) => setLogForm(p._id, { nextSteps: e.target.value })}
                            placeholder="Próximas ações definidas..."
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 12 }}>Decisões tomadas</label>
                          <textarea
                            rows={2}
                            value={getLogForm(p._id).decisions || ''}
                            onChange={(e) => setLogForm(p._id, { decisions: e.target.value })}
                            placeholder="Decisões registradas..."
                          />
                        </div>
                      </>
                    )}
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
