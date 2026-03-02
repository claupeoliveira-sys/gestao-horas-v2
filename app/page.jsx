'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useVisibilityRefresh } from './hooks/useVisibilityRefresh';
import Link from 'next/link';
import LoadingOverlay from './components/LoadingOverlay';
import { getProjectHealth } from '@/lib/projectHealth';
import { safeJson } from '@/lib/safeJson';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const DAYS_NEAR_DEADLINE = 15;

function statusBadge(status) {
  const map = {
    active: <span className="badge badge-active">Ativo</span>,
    paused: <span className="badge badge-paused">Pausado</span>,
    finished: <span className="badge badge-done">Concluído</span>,
  };
  return map[status] || null;
}

function getProjectId(ref) {
  return ref && (typeof ref === 'object' ? ref._id : ref);
}

export default function Home() {
  const pathname = usePathname();
  const [projects, setProjects] = useState([]);
  const [features, setFeatures] = useState([]);
  const [constatacoes, setConstatacoes] = useState([]);
  const [projectLogs, setProjectLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useVisibilityRefresh(() => setRefreshKey((k) => k + 1), pathname === '/');

  useEffect(() => {
    if (pathname !== '/') return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/dashboard');
        const data = await safeJson(res, {});
        if (!cancelled) {
          const obj = data && typeof data === 'object' ? data : {};
          setProjects(Array.isArray(obj.projects) ? obj.projects : []);
          setFeatures(Array.isArray(obj.features) ? obj.features : []);
          setConstatacoes(Array.isArray(obj.constatacoes) ? obj.constatacoes : []);
          setProjectLogs(Array.isArray(obj.projectLogs) ? obj.projectLogs : []);
        }
      } catch (err) {
        if (!cancelled) {
          setProjects([]);
          setFeatures([]);
          setConstatacoes([]);
          setProjectLogs([]);
          setError(err?.message || 'Erro ao carregar dados.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname, refreshKey]);

  function projectMetrics(projectId) {
    const list = features.filter((f) => getProjectId(f.projectId) === projectId);
    const total = list.length;
    const done = list.filter((f) => f.status === 'done').length;
    const blocked = list.filter((f) => f.status === 'block_internal' || f.status === 'block_client').length;
    const estimated = list.reduce((s, x) => s + (Number(x.estimatedHours) || 0), 0);
    const logged = list.reduce((s, x) => s + (Number(x.loggedHours) || 0), 0);
    const avg = total === 0 ? 0 : Math.round(list.reduce((s, x) => s + (x.percentComplete || 0), 0) / total);
    return { total, done, blocked, percent: avg, estimated, logged };
  }

  function lastLogDateForProject(projectId) {
    const projectLogsForProject = projectLogs.filter((l) => (typeof l.projectId === 'object' ? l.projectId?._id : l.projectId) === projectId);
    if (projectLogsForProject.length === 0) return null;
    const dates = projectLogsForProject.map((l) => (l.date && new Date(l.date)) || (l.createdAt && new Date(l.createdAt))).filter(Boolean);
    return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
  }

  function projectHealth(p, metrics) {
    const lastLog = lastLogDateForProject(p._id);
    return getProjectHealth(p, metrics, lastLog);
  }

  function buildAlerts() {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const near = new Date(today);
    near.setDate(near.getDate() + DAYS_NEAR_DEADLINE);

    projects.filter((p) => p.status === 'active').forEach((p) => {
      const pid = p._id;
      const name = p.name;
      const members = p.memberIds || [];
      const memberCount = Array.isArray(members) ? members.length : 0;
      const endDate = p.endDate ? new Date(p.endDate) : null;
      const m = projectMetrics(pid);

      if (memberCount === 0) list.push({ type: 'danger', message: 'Sem membros no projeto', projectId: pid, projectName: name });
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (end < today) list.push({ type: 'danger', message: 'Prazo vencido', projectId: pid, projectName: name });
        else if (end <= near) list.push({ type: 'warning', message: 'Prazo próximo', projectId: pid, projectName: name });
      }
      if (m.blocked > 0) list.push({ type: 'warning', message: `${m.blocked} tarefa(s) em impedimento`, projectId: pid, projectName: name });
    });
    return list;
  }

  const filteredProjects = selectedProject
    ? projects.filter((p) => p._id === selectedProject)
    : projects;
  const activeProjects = filteredProjects.filter((p) => p.status === 'active');
  const totalEstimated = selectedProject
    ? features.filter((f) => getProjectId(f.projectId) === selectedProject).reduce((s, f) => s + (Number(f.estimatedHours) || 0), 0)
    : features.reduce((s, f) => s + (Number(f.estimatedHours) || 0), 0);
  const totalLogged = selectedProject
    ? features.filter((f) => getProjectId(f.projectId) === selectedProject).reduce((s, f) => s + (Number(f.loggedHours) || 0), 0)
    : features.reduce((s, f) => s + (Number(f.loggedHours) || 0), 0);
  const alertsFiltered = selectedProject ? buildAlerts().filter((a) => a.projectId === selectedProject) : buildAlerts();
  const risksCount = selectedProject
    ? constatacoes.filter((c) => (c.projectId && (typeof c.projectId === 'object' ? c.projectId._id : c.projectId) === selectedProject) && c.type === 'risk').length
    : constatacoes.filter((c) => c.type === 'risk').length;

  if (loading) return <LoadingOverlay message="Aguarde, carregando..." />;

  return (
    <div>
      <h2 className="page-title" style={{ marginBottom: 4 }}>Dashboard executivo</h2>
      {error && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--danger)', background: 'var(--bg)' }}>
          <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => { setError(''); setRefreshKey((k) => k + 1); }}>Tentar novamente</button>
        </div>
      )}
      <p className="page-subtitle" style={{ marginBottom: 28 }}>
        Visão geral da saúde dos projetos, horas e alertas.
      </p>

      <div className="card" style={{ marginBottom: 28, background: 'var(--bg)', borderLeft: '4px solid var(--primary)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>Bem-vindo ao sistema</h3>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Este é o painel de gestão de horas e projetos. Use o menu para acessar Projetos, Features, Times, Clientes e Pessoas.
          Se você é novo por aqui, comece cadastrando clientes e projetos; o resumo e os alertas aparecerão neste dashboard.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-muted)' }}>Nenhum projeto cadastrado. Use o menu para começar.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 24 }}>
            <Link href="/projects">
              <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
                <p style={{ fontWeight: 600 }}>Projetos</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cadastrar e listar</p>
              </div>
            </Link>
            <Link href="/features">
              <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
                <p style={{ fontWeight: 600 }}>Features</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cadastrar e editar</p>
              </div>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Projeto:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{ minWidth: 280 }}
            >
              <option value="">Todos os projetos</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{(p.clientId?.name || p.client || '—')} — {p.name}</option>
              ))}
            </select>
          </div>

          <div className="dashboard-kpi">
            <div className="card">
              <div className="kpi-value">{activeProjects.length}</div>
              <div className="kpi-label">{selectedProject ? 'Projeto ativo' : 'Projetos ativos'}</div>
            </div>
            <div className="card">
              <div className="kpi-value">{totalEstimated.toFixed(0)}h</div>
              <div className="kpi-label">Horas estimadas</div>
            </div>
            <div className="card">
              <div className="kpi-value">{totalLogged.toFixed(0)}h</div>
              <div className="kpi-label">Horas realizadas</div>
            </div>
            <div className="card">
              <div className="kpi-value">{alertsFiltered.length}</div>
              <div className="kpi-label">Alertas</div>
            </div>
            <div className="card">
              <div className="kpi-value">{risksCount}</div>
              <div className="kpi-label">Riscos (constatações)</div>
            </div>
          </div>

          {filteredProjects.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--text)' }}>Horas estimadas vs. lançadas por projeto</h3>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredProjects.map((p) => {
                      const m = projectMetrics(p._id);
                      const shortName = (p.clientId?.name || p.client || '—') + ' — ' + p.name;
                      return {
                        name: shortName.length > 28 ? shortName.slice(0, 26) + '…' : shortName,
                        estimadas: Math.round(m.estimated * 10) / 10,
                        lançadas: Math.round(m.logged * 10) / 10,
                      };
                    })}
                    margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      angle={-35}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} stroke="var(--text-muted)" />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                      }}
                      formatter={(value, name) => [`${Number(value).toFixed(1)}h`, name === 'estimadas' ? 'Horas estimadas' : 'Horas lançadas']}
                      labelFormatter={(label) => label}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} formatter={(value) => (value === 'estimadas' ? 'Horas estimadas' : 'Horas lançadas')} />
                    <Bar dataKey="estimadas" fill="var(--primary)" radius={[4, 4, 0, 0]} name="estimadas" />
                    <Bar dataKey="lançadas" fill="var(--primary-light)" radius={[4, 4, 0, 0]} name="lançadas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {filteredProjects.length > 0 && (() => {
            const alertsList = buildAlerts();
            const byClient = {};
            filteredProjects.forEach((p) => {
              const clientName = p.clientId?.name || p.client || '—';
              if (!byClient[clientName]) {
                byClient[clientName] = { projects: [], alertCount: 0, estimated: 0, logged: 0, progressSum: 0 };
              }
              const m = projectMetrics(p._id);
              byClient[clientName].projects.push(p);
              byClient[clientName].estimated += m.estimated;
              byClient[clientName].logged += m.logged;
              byClient[clientName].progressSum += m.percent || 0;
              byClient[clientName].alertCount += alertsList.filter((a) => a.projectId === p._id).length;
            });
            const clientEntries = Object.entries(byClient);
            if (clientEntries.length === 0) return null;
            return (
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Resumo por cliente</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {clientEntries.map(([clientName, data]) => {
                    const count = data.projects.length;
                    const avgProgress = count ? Math.round(data.progressSum / count) : 0;
                    return (
                      <div
                        key={clientName}
                        className="card"
                        style={{
                          borderLeft: '4px solid var(--primary)',
                          padding: 16,
                          background: 'var(--card)',
                        }}
                      >
                        <h4 style={{ fontSize: 16, margin: '0 0 12px', color: 'var(--text)' }}>{clientName}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}>
                          <span>Projetos: <strong style={{ color: 'var(--text)' }}>{count}</strong></span>
                          <span>Progresso médio: <strong style={{ color: 'var(--text)' }}>{avgProgress}%</strong></span>
                          <span>Horas: <strong style={{ color: 'var(--text)' }}>{data.logged.toFixed(0)}h</strong> / {data.estimated.toFixed(0)}h estimadas</span>
                          <span>Alertas ativos: <strong style={{ color: data.alertCount > 0 ? 'var(--danger)' : 'var(--text)' }}>{data.alertCount}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {alertsFiltered.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, marginBottom: 14 }}>Alertas</h3>
              <ul className="dashboard-alerts">
                {alertsFiltered.slice(0, 15).map((a, i) => (
                  <li key={i} className={a.type === 'danger' ? 'alert-danger' : 'alert-warning'}>
                    <span className={`health-dot ${a.type === 'danger' ? 'red' : 'yellow'}`} />
                    <span><strong>{a.projectName}</strong> — {a.message}</span>
                    <Link href={`/status-report?project=${a.projectId}`} style={{ marginLeft: 'auto', fontSize: 13 }}>Ver projeto</Link>
                  </li>
                ))}
              </ul>
              {alertsFiltered.length > 15 && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>+ {alertsFiltered.length - 15} alertas.</p>}
            </div>
          )}

          <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--text-muted)' }}>Saúde dos projetos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filteredProjects.map((p) => {
              const m = projectMetrics(p._id);
              const health = projectHealth(p, m);
              return (
                <Link key={p._id} href={`/status-report?project=${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }} title="Ver Status Report">
                  <div className="card" style={{ cursor: 'pointer', height: '100%', borderLeft: `4px solid ${health === 'red' ? 'var(--danger)' : health === 'yellow' ? 'var(--warning)' : 'var(--success)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <span className={`health-dot ${health}`} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <h4 style={{ fontSize: 16, margin: 0 }}>{(p.clientId?.name || p.client || '—')} — {p.name}</h4>
                          {statusBadge(p.status)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 13 }}>
                      <span>Tarefas: <strong>{m.done}/{m.total}</strong></span>
                      <span>Horas: <strong>{m.logged.toFixed(0)}h</strong> / {m.estimated.toFixed(0)}h</span>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <div className="progress-bar" style={{ height: 10 }}>
                        <div className="progress-fill" style={{ width: `${m.percent}%` }} />
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}><strong>{m.percent}%</strong> concluído</p>
                    {p.endDate && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                        Prazo: {new Date(p.endDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
