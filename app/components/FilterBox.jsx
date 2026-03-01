'use client';

export default function FilterBox({ children, onClear, hasActiveFilters, style = {} }) {
  return (
    <div
      className="filter-box"
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background: 'var(--bg-subtle)',
        width: 'fit-content',
        maxWidth: '100%',
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        Filtros
      </span>
      <span style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} aria-hidden />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        {children}
        {onClear && hasActiveFilters && (
          <button type="button" className="btn btn-ghost btn-clear-filters" onClick={onClear}>
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
