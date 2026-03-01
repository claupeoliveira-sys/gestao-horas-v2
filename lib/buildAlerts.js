const DAYS_NEAR_DEADLINE = 15;

function getProjectId(ref) {
  return ref && (typeof ref === 'object' ? ref._id : ref);
}

function projectMetrics(projectId, features) {
  const list = features.filter((f) => getProjectId(f.projectId) === projectId);
  const total = list.length;
  const done = list.filter((f) => f.status === 'done').length;
  const blocked = list.filter((f) => f.status === 'block_internal' || f.status === 'block_client').length;
  const estimated = list.reduce((s, x) => s + (Number(x.estimatedHours) || 0), 0);
  const logged = list.reduce((s, x) => s + (Number(x.loggedHours) || 0), 0);
  return { total, done, blocked, estimated, logged };
}

export function buildAlertsFromData(projects, features) {
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
    const m = projectMetrics(pid, features);

    if (memberCount === 0) list.push({ id: `nomembers-${pid}`, type: 'danger', message: 'Sem membros no projeto', projectId: pid, projectName: name });
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      if (end < today) list.push({ id: `overdue-${pid}`, type: 'danger', message: 'Prazo vencido', projectId: pid, projectName: name });
      else if (end <= near) list.push({ id: `near-${pid}`, type: 'warning', message: 'Prazo próximo', projectId: pid, projectName: name });
    }
    if (m.blocked > 0) list.push({ id: `blocked-${pid}`, type: 'warning', message: `${m.blocked} tarefa(s) em impedimento`, projectId: pid, projectName: name });
    if (m.estimated > 0 && m.logged >= m.estimated) list.push({ id: `hours-${pid}`, type: 'danger', message: 'Horas estouradas', projectId: pid, projectName: name });
  });
  return list;
}
