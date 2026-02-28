'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from './components/LoadingSpinner';

function statusBadge(status) {
  const map = {
    active: <span className="badge badge-active">Ativo</span>,
    paused: <span className="badge badge-paused">Pausado</span>,
    finished: <span className="badge badge-done">Concluído</span>,
  };
  return map[status] || null;
}

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pRes, fRes] = await Promise.all([fetch('/api/projects'), fetch('/api/features')]);
      const [p, f] = await Promise.all([pRes.json(), fRes.json()]);
      setProjects(p);
      setFeatures(f);
      setLoading(false);
    }
    load();
  }, []);

  function projectMetrics(projectId) {
    const list = features.filter((f) => f.projectId === projectId);
    const total = list.length;
    const done = list.filter((f) => f.status === 'done').length;
    const avg = total === 0 ? 0 : Math.round(list.reduce((s, x) => s + (x.percentComplete || 0), 0) / total);
    return { total, done, percent: avg };
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>Bem-vindo ao Gestão de Horas</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Selecione uma opção no menu lateral ou acesse um projeto abaixo.
      </p>

      {loading ? (
        <div className="card">
          <LoadingSpinner message="Aguarde, carregando..." />
        </div>
      ) : projects.length === 0 ? (
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
          <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--text-muted)' }}>Projetos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projects.map((p) => {
              const m = projectMetrics(p._id);
              return (
                <Link key={p._id} href={`/status-report?project=${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }} title="Ver Status Report deste projeto">
                  <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 16, margin: 0 }}>{p.name}</h4>
                      {statusBadge(p.status)}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Cliente: {p.client}</p>
                    <p style={{ fontSize: 13, marginBottom: 8 }}>Tarefas: <strong>{m.done}/{m.total}</strong></p>
                    <div style={{ marginBottom: 4 }}>
                      <div className="progress-bar" style={{ height: 10 }}>
                        <div className="progress-fill" style={{ width: `${m.percent}%` }} />
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}><strong>{m.percent}%</strong> concluído</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <h3 style={{ fontSize: 16, marginTop: 32, marginBottom: 16, color: 'var(--text-muted)' }}>Atalhos</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
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
            <Link href="/kanban">
              <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
                <p style={{ fontWeight: 600 }}>Kanban</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Quadro de tarefas</p>
              </div>
            </Link>
            <Link href="/status-report">
              <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
                <p style={{ fontWeight: 600 }}>Status Report</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Visão executiva</p>
              </div>
            </Link>
            <Link href="/people">
              <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
                <p style={{ fontWeight: 600 }}>Pessoas</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cadastro de pessoas</p>
              </div>
            </Link>
            <Link href="/teams">
              <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
                <p style={{ fontWeight: 600 }}>Times</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cadastro de times</p>
              </div>
            </Link>
            <Link href="/acompanhamento">
              <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
                <p style={{ fontWeight: 600 }}>Acompanhamento</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Feedbacks e situações</p>
              </div>
            </Link>
            <Link href="/alocacoes">
              <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
                <p style={{ fontWeight: 600 }}>Alocações</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Colaborador x projeto</p>
              </div>
            </Link>
            <Link href="/constatacoes">
              <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
                <p style={{ fontWeight: 600 }}>Constatações</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Riscos, oportunidades e IA</p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
