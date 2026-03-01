'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import BuildInfo from './BuildInfo';

const NAV_ICONS = {
  home: '🏠',
  cadastros: '📋',
  clientes: '👥',
  projetos: '📁',
  epicos: '📦',
  features: '✨',
  operacao: '⚙️',
  kanban: '📌',
  status: '📊',
  tarefas: '📋',
  equipes: '👤',
  pessoas: '🧑‍💼',
  times: '👥',
  gestao: '📈',
  acompanhamento: '📉',
  painel: '🖥️',
  alocacoes: '📅',
  constatacoes: '📝',
  dashboard: '🔐',
};

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isPublic = pathname === '/login' || pathname === '/alterar-senha';

  const adminOnlyPaths = ['/people', '/teams', '/clients', '/projects', '/epics', '/features', '/acompanhamento', '/painel-analistas', '/alocacoes', '/constatacoes'];

  useEffect(() => {
    if (isPublic) {
      setLoading(false);
      return;
    }
    fetch('/api/auth/session', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
        if (!data.user) router.replace('/login');
      })
      .catch(() => {
        setLoading(false);
        router.replace('/login');
      });
  }, [pathname, isPublic, router]);

  useEffect(() => {
    if (!user || user.profileRole === 'admin') return;
    if (adminOnlyPaths.includes(pathname)) router.replace('/');
  }, [user, pathname, router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.replace('/login');
    router.refresh();
  }

  if (isPublic) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
      </div>
    );
  }

  const isAdmin = user?.profileRole === 'admin';

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>ToolBOX OPS</h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href="/" className="nav-link">
            <span className="nav-icon">{NAV_ICONS.home}</span> Início
          </Link>
          {isAdmin && (
            <>
              <div className="nav-group-label">Cadastros</div>
              <Link href="/clients" className="nav-link">
                <span className="nav-icon">{NAV_ICONS.clientes}</span> Clientes
              </Link>
              <Link href="/projects" className="nav-link">
                <span className="nav-icon">{NAV_ICONS.projetos}</span> Projetos
              </Link>
              <Link href="/epics" className="nav-link">
                <span className="nav-icon">{NAV_ICONS.epicos}</span> Épicos
              </Link>
              <Link href="/features" className="nav-link">
                <span className="nav-icon">{NAV_ICONS.features}</span> Features
              </Link>
            </>
          )}
          <div className="nav-group-label">Operação</div>
          <Link href="/kanban" className="nav-link">
            <span className="nav-icon">{NAV_ICONS.kanban}</span> Kanban
          </Link>
          <Link href="/status-report" className="nav-link">
            <span className="nav-icon">{NAV_ICONS.status}</span> Status Report
          </Link>
          <Link href="/trabalho-analista" className="nav-link">
            <span className="nav-icon">{NAV_ICONS.tarefas}</span> Tarefas por pessoa
          </Link>
          {isAdmin && (
            <>
              <div className="nav-group-label">Equipes</div>
              <Link href="/people" className="nav-link">
                <span className="nav-icon">{NAV_ICONS.pessoas}</span> Pessoas
              </Link>
              <Link href="/teams" className="nav-link">
                <span className="nav-icon">{NAV_ICONS.times}</span> Times
              </Link>
              <div className="nav-group-label">Gestão</div>
              <Link href="/acompanhamento" className="nav-link">
                <span className="nav-icon">{NAV_ICONS.acompanhamento}</span> Acompanhamento
              </Link>
              <Link href="/painel-analistas" className="nav-link">
                <span className="nav-icon">{NAV_ICONS.painel}</span> Painel de Pessoas
              </Link>
              <Link href="/alocacoes" className="nav-link">
                <span className="nav-icon">{NAV_ICONS.alocacoes}</span> Alocações
              </Link>
              <Link href="/constatacoes" className="nav-link">
                <span className="nav-icon">{NAV_ICONS.constatacoes}</span> Constatações
              </Link>
            </>
          )}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{user?.name || '—'}</p>
          <button type="button" className="btn btn-ghost" onClick={handleLogout} style={{ fontSize: 12 }}>
            Sair
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div style={{ position: 'relative', minHeight: '100%', paddingTop: 6, paddingRight: 150 }}>
          <BuildInfo />
          {children}
        </div>
      </main>
    </div>
  );
}
