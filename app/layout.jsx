import './globals.css';
import Link from 'next/link';
import BuildInfo from './components/BuildInfo';

export const metadata = {
  title: 'ToolBOX OPS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
              ToolBOX OPS
            </h1>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Link href="/" className="nav-link">Início</Link>
              <div className="nav-group-label">Cadastros</div>
              <Link href="/clients" className="nav-link">Clientes</Link>
              <Link href="/projects" className="nav-link">Projetos</Link>
              <Link href="/epics" className="nav-link">Épicos</Link>
              <Link href="/features" className="nav-link">Features</Link>
              <div className="nav-group-label">Operação</div>
              <Link href="/kanban" className="nav-link">Kanban</Link>
              <Link href="/status-report" className="nav-link">Status Report</Link>
              <Link href="/trabalho-analista" className="nav-link">Tarefas por pessoa</Link>
              <div className="nav-group-label">Equipes</div>
              <Link href="/people" className="nav-link">Pessoas</Link>
              <Link href="/teams" className="nav-link">Times</Link>
              <div className="nav-group-label">Gestão</div>
              <Link href="/acompanhamento" className="nav-link">Acompanhamento</Link>
              <Link href="/painel-analistas" className="nav-link">Painel de Pessoas</Link>
              <Link href="/alocacoes" className="nav-link">Alocações</Link>
              <Link href="/constatacoes" className="nav-link">Constatações</Link>
            </nav>
          </aside>
          <main className="main-content">
            <div style={{ position: 'relative', minHeight: '100%', paddingTop: 6, paddingRight: 150 }}>
              <BuildInfo />
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
