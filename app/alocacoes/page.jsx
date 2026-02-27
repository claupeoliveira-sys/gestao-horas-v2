'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AlocacoesPage() {
  const router = useRouter();
  const [people, setPeople] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [filterPerson, setFilterPerson] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    personId: '',
    projectId: '',
    percentual: '',
    horasPrevistas: '',
    observacao: '',
    startDate: '',
    endDate: '',
  });

  async function loadPeople() {
    const res = await fetch('/api/people');
    const data = await res.json();
    setPeople(data);
  }

  async function loadProjects() {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
  }

  async function loadAllocations() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterPerson) params.append('personId', filterPerson);
    if (filterProject) params.append('projectId', filterProject);
    const res = await fetch('/api/allocations?' + params.toString());
    const data = await res.json();
    setAllocations(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPeople();
    loadProjects();
  }, []);

  useEffect(() => {
    loadAllocations();
  }, [filterPerson, filterProject]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const body = {
      personId: form.personId,
      projectId: form.projectId,
      percentual: Number(form.percentual) || 0,
      horasPrevistas: Number(form.horasPrevistas) || 0,
      observacao: form.observacao || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    };
    if (editingId) {
      await fetch(`/api/allocations/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setEditingId(null);
    } else {
      await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    setSaving(false);
    setForm({
      personId: '',
      projectId: '',
      percentual: '',
      horasPrevistas: '',
      observacao: '',
      startDate: '',
      endDate: '',
    });
    loadAllocations();
  }

  function startEdit(a) {
    const personId = typeof a.personId === 'object' ? a.personId?._id : a.personId;
    const projectId = typeof a.projectId === 'object' ? a.projectId?._id : a.projectId;
    setEditingId(a._id);
    setForm({
      personId: personId || '',
      projectId: projectId || '',
      percentual: String(a.percentual ?? ''),
      horasPrevistas: String(a.horasPrevistas ?? ''),
      observacao: a.observacao || '',
      startDate: a.startDate ? a.startDate.slice(0, 10) : '',
      endDate: a.endDate ? a.endDate.slice(0, 10) : '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      personId: '',
      projectId: '',
      percentual: '',
      horasPrevistas: '',
      observacao: '',
      startDate: '',
      endDate: '',
    });
  }

  async function handleDelete(id) {
    if (!confirm('Remover esta alocação?')) return;
    await fetch(`/api/allocations/${id}`, { method: 'DELETE' });
    loadAllocations();
    if (editingId === id) cancelEdit();
  }

  function personName(a) {
    const p = a.personId;
    return (typeof p === 'object' && p?.name) || '—';
  }

  function projectName(a) {
    const p = a.projectId;
    return (typeof p === 'object' && p?.name) || '—';
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Alocação em projetos</h2>
          <p className="page-subtitle">
            Defina percentual e horas previstas por colaborador em cada projeto.
          </p>
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => router.back()}
        >
          ← Voltar
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>
          {editingId ? 'Editar alocação' : 'Nova alocação'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 220px' }}>
              <label>Colaborador *</label>
              <select
                value={form.personId}
                onChange={(e) => setForm({ ...form, personId: e.target.value })}
                required
                disabled={!!editingId}
              >
                <option value="">Selecione...</option>
                {people.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 220px' }}>
              <label>Projeto *</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                required
                disabled={!!editingId}
              >
                <option value="">Selecione...</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.client})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: '0 1 100px' }}>
              <label>% alocação *</label>
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value={form.percentual}
                onChange={(e) => setForm({ ...form, percentual: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ flex: '0 1 120px' }}>
              <label>Horas previstas *</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.horasPrevistas}
                onChange={(e) =>
                  setForm({ ...form, horasPrevistas: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 140px' }}>
              <label>Início (opcional)</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: '1 1 140px' }}>
              <label>Fim (opcional)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Observação</label>
            <input
              value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              placeholder="Ex: foco em backend"
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar alocação'}
            </button>
            {editingId && (
              <button
                className="btn btn-outline"
                type="button"
                onClick={cancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h3 style={{ fontSize: 18 }}>Alocações</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
              style={{ minWidth: 180 }}
            >
              <option value="">Todos colaboradores</option>
              {people.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              style={{ minWidth: 180 }}
            >
              <option value="">Todos projetos</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <p>Carregando...</p>
        ) : allocations.length === 0 ? (
          <p>Nenhuma alocação cadastrada.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Projeto</th>
                <th>%</th>
                <th>Horas prev.</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a) => (
                <tr key={a._id}>
                  <td>{personName(a)}</td>
                  <td>{projectName(a)}</td>
                  <td>{a.percentual}%</td>
                  <td>{a.horasPrevistas}h</td>
                  <td>
                    {a.startDate
                      ? new Date(a.startDate).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td>
                    {a.endDate
                      ? new Date(a.endDate).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '4px 8px', fontSize: 12, marginRight: 4 }}
                      onClick={() => startEdit(a)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        color: 'var(--danger)',
                        borderColor: 'var(--danger)',
                      }}
                      onClick={() => handleDelete(a._id)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
