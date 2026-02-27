import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Gestão de Horas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
              Gestão de Horas
            </h1>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/" className="nav-link">Início</Link>
              <Link href="/projects" className="nav-link">Projetos</Link>
              <Link href="/epics" className="nav-link">Épicos</Link>
              <Link href="/features" className="nav-link">Features</Link>
              <Link href="/status-report" className="nav-link">Status Report</Link>
              <Link href="/people" className="nav-link">Pessoas</Link>
              <Link href="/teams" className="nav-link">Times</Link>
              <Link href="/acompanhamento" className="nav-link">Acompanhamento</Link>
              <Link href="/alocacoes" className="nav-link">Alocações</Link>
              <Link href="/constatacoes" className="nav-link">Constatações</Link>
            </nav>
          </aside>
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
