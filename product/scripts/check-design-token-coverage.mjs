#!/usr/bin/env node
import { execSync } from 'node:child_process';

const targets = [
  'product/apps/web/app',
  'product/apps/web/components',
  'product/apps/web/src/components',
  'product/apps/consumer-mobile/app',
  'product/apps/consumer-mobile/src/components',
  'product/apps/consumer-mobile/src/theme',
];

const allowList = new Set([
  'product/apps/consumer-mobile/src/components/entry/entrySvgXml.ts',
  'product/apps/consumer-mobile/src/components/entry/MobileEntrySplash.tsx',
  'product/apps/consumer-mobile/src/components/entry/MobileEntrySplash.styles.ts',
  'product/apps/web/components/AnimatedSplash.tsx',
  'product/apps/web/app/globals.css',
]);

const patterns = [
  { label: 'hardcoded hex', regex: /#[0-9a-fA-F]{3,8}\b/ },
  { label: 'hardcoded rgb/rgba/hsl/hsla', regex: /\b(?:rgb|rgba|hsl|hsla)\(/ },
  { label: 'legacy neutral text utility', regex: /text-neutral-/ },
  { label: 'legacy neutral bg utility', regex: /bg-neutral-/ },
  { label: 'legacy neutral border utility', regex: /border-neutral-/ },
  { label: 'legacy zinc text utility', regex: /text-zinc-/ },
  { label: 'legacy zinc bg utility', regex: /bg-zinc-/ },
  { label: 'legacy zinc border utility', regex: /border-zinc-/ },
];

const diffCommand = `git diff --unified=0 -- ${targets.map(target => `'${target}'`).join(' ')}`;
let diff = '';
try {
  diff = execSync(diffCommand, { encoding: 'utf8' });
} catch (error) {
  diff = String(error.stdout || '');
}

if (!diff.trim()) {
  console.log('Design token guardrail passed (no user-facing diff).');
  process.exit(0);
}

let currentFile = '';
const violations = [];

for (const line of diff.split('\n')) {
  if (line.startsWith('+++ b/')) {
    currentFile = line.replace('+++ b/', '');
    continue;
  }

  if (!currentFile || allowList.has(currentFile)) continue;
  if (!line.startsWith('+') || line.startsWith('+++')) continue;

  const content = line.slice(1);
  for (const pattern of patterns) {
    if (pattern.regex.test(content)) {
      violations.push({ file: currentFile, label: pattern.label, content: content.trim() });
      break;
    }
  }
}

if (violations.length > 0) {
  console.error('\n[design-system-guardrail] Found forbidden style literals in added lines:');
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.label} -> ${violation.content}`);
  }
  console.error('\nMigrate to visual tokens or add an explicit allowlist entry.');
  process.exit(1);
}

console.log('Design token guardrail passed.');
