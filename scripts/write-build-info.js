const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const outPath = path.join(__dirname, '..', 'public', 'build-info.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const buildTime = new Date().toISOString();
const buildInfo = {
  version: pkg.version || '0.1.0',
  buildTime,
};

const publicDir = path.dirname(outPath);
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(buildInfo, null, 2), 'utf8');
console.log('Build info written:', buildInfo);
