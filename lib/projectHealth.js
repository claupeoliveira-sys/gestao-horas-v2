/**
 * Calcula o indicador de saúde do projeto.
 * @param {Object} project - Projeto com endDate, status
 * @param {{ estimated: number, logged: number, blocked: number }} metrics - Métricas do projeto
 * @param {Date|string|null} lastLogDate - Data do último registro no diário de bordo (project log)
 * @returns { 'green' | 'yellow' | 'red' }
 */
export function getProjectHealth(project, metrics, lastLogDate = null) {
  if (project.status === 'finished') return 'green';

  const members = project.memberIds || [];
  if (Array.isArray(members) && members.length === 0) return 'red';

  const { estimated = 0, logged = 0, blocked = 0 } = metrics;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (project.endDate) {
    const end = new Date(project.endDate);
    end.setHours(0, 0, 0, 0);
    if (end < today) return 'red';
  }

  if (estimated > 0) {
    const ratio = logged / estimated;
    if (ratio >= 1) return 'red';
    if (ratio >= 0.8) return 'yellow';
  }

  if (lastLogDate) {
    const last = new Date(lastLogDate);
    last.setHours(0, 0, 0, 0);
    const daysSince = Math.floor((today - last) / (1000 * 60 * 60 * 24));
    if (daysSince >= 14) return 'yellow';
  } else if (project._id) {
    return 'yellow';
  }

  if (blocked > 0) return 'yellow';

  return 'green';
}
