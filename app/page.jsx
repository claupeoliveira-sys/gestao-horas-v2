import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>Bem-vindo ao Gestão de Horas</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Selecione uma opção no menu lateral para começar.
      </p>
      <div style={{ display: 'flex', gap: 16 }}>
        <Link href="/projects">
          <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
            <p style={{ fontWeight: 600 }}>Projetos</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cadastrar e listar</p>
          </div>
        </Link>
        <Link href="/epics">
          <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
            <p style={{ fontWeight: 600 }}>Épicos</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cadastrar e listar</p>
          </div>
        </Link>
        <Link href="/features">
          <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
            <p style={{ fontWeight: 600 }}>Features</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cadastrar e editar</p>
          </div>
        </Link>
        <Link href="/status-report">
          <div className="card" style={{ cursor: 'pointer', minWidth: 160 }}>
            <p style={{ fontWeight: 600 }}>Status Report</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Visão executiva</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
