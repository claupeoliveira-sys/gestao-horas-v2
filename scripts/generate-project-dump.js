const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.css'];
const SEP = '\n' + '='.repeat(80) + '\n';

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git') continue;
      yield* walk(full);
    } else if (EXTENSIONS.includes(path.extname(e.name))) {
      yield path.relative(ROOT, full).split(path.sep).join('/');
    }
  }
}

const files = [...walk(ROOT)].sort();
const out = [];
for (const rel of files) {
  const full = path.join(ROOT, rel);
  const content = fs.readFileSync(full, 'utf8');
  out.push('########## ' + rel + ' ##########\n\n' + content);
}
fs.writeFileSync(path.join(ROOT, 'project-dump.txt'), out.join(SEP), 'utf8');
console.log('Written project-dump.txt with', files.length, 'files');
