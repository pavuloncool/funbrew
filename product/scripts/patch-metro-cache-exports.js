const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve(
  __dirname,
  '..',
  '..',
  'node_modules',
  '.pnpm',
  'node_modules',
  'metro-cache',
  'package.json'
);

if (!fs.existsSync(pkgPath)) {
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.exports = pkg.exports || {};

// Compatibility shim for @expo/metro-config which imports metro-cache/src/stores/FileStore
if (!pkg.exports['./src']) {
  pkg.exports['./src'] = './src/index.js';
}
if (!pkg.exports['./src/*']) {
  pkg.exports['./src/*'] = './src/*.js';
}
if (!pkg.exports['./src/*.js']) {
  pkg.exports['./src/*.js'] = './src/*.js';
}

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
