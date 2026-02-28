'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

const STATUS_LABEL = {
  backlog: 'Backlog',
  in_progress: 'Em andamento',
  block_internal: 'Imped. interno',
  block_client: 'Imped. cliente',
  done: 'Concluída',
};

export default function PainelAnalistasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [people, setPeople] = useState([]);
  const [projects, setProjects] = useState([]);
  const [features, setFeatures] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname !== '/painel-analistas') return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [pRes, projRes, fRes, aRes] = await Promise.all([
          fetch('/api/people'),
          fetch('/api/projects'),
          fetch('/api/features'),
          fetch('/api/allocations'),
        ]);
        const [p, proj, f, a] = await Promise.all([pRes.json(), projRes.json(), fRes.json(), aRes.json()]);
        if (!cancelled) {
          setPeople(p);
          setProjects(proj);
          setFeatures(f);
          setAllocations(a);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [pathname]);

  function projectName(id) {
    const proj = projects.find((x) => x._id === id);
    return (typeof proj === 'object' && proj?.name) || '—';
  }

  function teamName(person) {
    if (person.teamId && typeof person.teamId === 'object') return person.teamId.name;
    return person.team || '—';
  }

  function projectsForPerson(personId) {
    const asMember = projects.filter((p) => (p.memberIds || []).some((m) => (typeof m === 'object' ? m._id : m) === personId));
    const allocs = allocations.filter((a) => (typeof a.personId === 'object' ? a.personId?._id : a.personId) === personId);
    const byProject = {};
    asMember.forEach((p) => {
      byProject[p._id] = { name: p.name, percent: null, hours: null, fromAllocation: false };
    });
    allocs.forEach((a) => {
      const pid = typeof a.projectId === 'object' ? a.projectId?._id : a.projectId;
      byProject[pid] = { name: projectName(pid), percent: a.percentual, hours: a.horasPrevistas, fromAllocation: true };
    });
    return Object.entries(byProject).map(([id, v]) => ({ projectId: id, ...v }));
  }

  function tasksForPerson(personId) {
    return features.filter((f) =>
      (f.analystIds || []).some((a) => (typeof a === 'object' ? a._id : a) === personId)
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Painel de Pessoas</h2>
          <p className="page-subtitle">
            Projetos, tarefas e percentual de alocação por pessoa.
          </p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => router.back()}>
          ← Voltar
        </button>
      </div>

      {loading ? (
        <div className="card">
          <LoadingSpinner message="Aguarde, carregando..." />
        </div>
      ) : people.length === 0 ? (
        <div className="card">
          <p>Cadastre pessoas em Pessoas para ver o painel.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {people.map((person) => {
            const projs = projectsForPerson(person._id);
            const tasks = tasksForPerson(person._id);
            return (
              <div key={person._id} className="card" style={{ padding: 16 }}>
                <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: 16, marginBottom: 4 }}>{person.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{person.role || '—'}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Time: {teamName(person)}</p>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Projetos e alocação</p>
                  {projs.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum projeto</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {projs.map(({ projectId, name, percent, hours, fromAllocation }) => (
                        <li key={projectId} style={{ fontSize: 13, marginBottom: 4 }}>
                          {name}
                          {fromAllocation && (percent != null || hours != null) && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                              — {percent != null && `${percent}%`} {hours != null && `${hours}h prev.`}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Tarefas atribuídas</p>
                  {tasks.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma tarefa</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {tasks.map((t) => (
                        <li key={t._id} style={{ fontSize: 13, marginBottom: 6, padding: 6, background: 'var(--bg)', borderRadius: 4 }}>
                          <span style={{ fontWeight: 500 }}>{t.name}</span>
                          <br />
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {projectName(t.projectId)} · {STATUS_LABEL[t.status] || t.status} · {t.percentComplete ?? 0}% concluído
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
