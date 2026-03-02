const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);
const DUMP = path.join(ROOT, 'dump.txt');

const alreadyInDump = new Set();
const dumpContent = fs.readFileSync(DUMP, 'utf8');
const matches = dumpContent.matchAll(/^===== ([^\s=]+) =====/gm);
for (const m of matches) alreadyInDump.add(m[1].trim());

function* walk(dir, ext) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git') continue;
    if (e.isDirectory()) yield* walk(full, ext);
    else if (ext.some(s => e.name.endsWith(s))) yield full;
  }
}

const appFiles = [...walk(path.join(ROOT, 'app'), ['.js', '.jsx', '.css', '.json'])];
const libFiles = [...walk(path.join(ROOT, 'lib'), ['.js', '.jsx', '.css', '.json'])];
const allPaths = [];
for (const f of appFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  allPaths.push(rel);
}
for (const f of libFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  allPaths.push(rel);
}
allPaths.sort();

const toAdd = allPaths.filter(p => !alreadyInDump.has(p));
if (toAdd.length === 0) {
  console.log('Nada a adicionar.');
  process.exit(0);
}

let append = '';
for (const p of toAdd) {
  const fullPath = path.join(ROOT, p);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, 'utf8');
  append += `\n===== ${p} =====\n${content}\n`;
}

let newContent = dumpContent.replace(/\n__APPEND__\s*$/, append + '\n');
if (newContent.endsWith('\n\n')) newContent = newContent.slice(0, -1);
fs.writeFileSync(DUMP, newContent, 'utf8');
console.log('Adicionados:', toAdd.length, toAdd);
