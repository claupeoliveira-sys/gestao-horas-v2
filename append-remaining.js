const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DUMP = path.join(ROOT, 'dump.txt');

const paths = [
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

let content = fs.readFileSync(DUMP, 'utf8');

for (const p of paths) {
  const fullPath = path.join(ROOT, p);
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const block = '\n===== ' + p + ' =====\n' + fileContent + '\n';
  content = content.replace(/\n__APPEND__\s*$/, block + '__APPEND__');
}

content = content.replace(/\n\n__APPEND__\s*$/, '').replace(/\n__APPEND__\s*$/, '');
fs.writeFileSync(DUMP, content, 'utf8');
console.log('Adicionados 9 arquivos e __APPEND__ removido.');
