const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DUMP_PATH = path.join(ROOT, 'dump.txt');

const FILES = [
  'app/constatacoes/page.jsx',
  'app/diario-bordo/page.jsx',
  'app/epics/page.jsx',
  'app/features/page.jsx',
  'app/kanban/page.jsx',
  'app/page.jsx',
  'app/painel-analistas/page.jsx',
  'app/people/page.jsx',
  'app/projects/page.jsx',
  'app/status-report/page.jsx',
  'app/teams/page.jsx',
  'app/trabalho-analista/page.jsx',
];

let dump = fs.readFileSync(DUMP_PATH, 'utf8');

for (const filePath of FILES) {
  const fullPath = path.join(ROOT, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const block = `\n===== ${filePath} =====\n${content}\n__APPEND__`;
  dump = dump.replace(/\n__APPEND__$/, block);
}

dump = dump.replace(/\n\n__APPEND__\s*$/, '');
dump = dump.replace(/\n__APPEND__\s*$/, '');

fs.writeFileSync(DUMP_PATH, dump, 'utf8');
console.log('Dump atualizado: 12 arquivos adicionados e __APPEND__ removido.');
