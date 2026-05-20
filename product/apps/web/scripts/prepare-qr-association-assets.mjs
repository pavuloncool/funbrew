#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, '..');
const productRoot = path.resolve(webDir, '..', '..');
const repoRoot = path.resolve(productRoot, '..');

for (const envPath of [
  path.join(repoRoot, '.env'),
  path.join(repoRoot, '.env.local'),
  path.join(productRoot, '.env'),
  path.join(productRoot, '.env.local'),
  path.join(webDir, '.env'),
  path.join(webDir, '.env.local'),
]) {
  if (fs.existsSync(envPath)) {
    loadDotenv({ path: envPath, override: true });
  }
}

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const strict = args.has('--strict') || checkOnly;

const publicDir = path.join(webDir, 'public');
const wellKnownDir = path.join(publicDir, '.well-known');
const assetLinksPath = path.join(wellKnownDir, 'assetlinks.json');
const aasaRootPath = path.join(publicDir, 'apple-app-site-association');
const aasaWellKnownPath = path.join(wellKnownDir, 'apple-app-site-association');

const warnings = [];
const errors = [];

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function parseUrl(value, label, protocols) {
  if (!value) return null;

  try {
    const parsed = new URL(value);

    if (protocols && !protocols.includes(parsed.protocol)) {
      addError(`${label} must use ${protocols.join(' or ')}, received ${parsed.protocol}`);
      return null;
    }

    return parsed;
  } catch {
    addError(`${label} must be a valid absolute URL`);
    return null;
  }
}

function parseHost(value, label) {
  if (!value) return null;

  if (value.includes('://') || value.includes('/') || value.includes('?') || value.includes('#')) {
    addError(`${label} must be a host only, without scheme or path`);
    return null;
  }

  try {
    return new URL(`https://${value}`).hostname.toLowerCase();
  } catch {
    addError(`${label} must be a valid host`);
    return null;
  }
}

function splitFingerprints(value) {
  if (!value) return [];

  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isValidFingerprint(value) {
  return /^([A-Fa-f0-9]{2}:){31}[A-Fa-f0-9]{2}$/.test(value);
}

function validateStoreUrl(value, label, allowedHosts) {
  if (!value) {
    if (strict) {
      addError(`${label} is required for store fallback readiness`);
    } else {
      addWarning(`${label} is not set`);
    }
    return;
  }

  const parsed = parseUrl(value, label, ['https:']);
  if (!parsed) return;

  if (!allowedHosts.includes(parsed.hostname.toLowerCase())) {
    addError(`${label} must point to one of: ${allowedHosts.join(', ')}`);
  }
}

const nextPublicAppUrl = parseUrl(process.env.NEXT_PUBLIC_APP_URL?.trim(), 'NEXT_PUBLIC_APP_URL', [
  'http:',
  'https:',
]);
const expoPublicRoasterWebUrl = parseUrl(
  process.env.EXPO_PUBLIC_ROASTER_WEB_URL?.trim(),
  'EXPO_PUBLIC_ROASTER_WEB_URL',
  ['http:', 'https:']
);
const qrPublicHost = parseHost(process.env.QR_PUBLIC_HOST?.trim(), 'QR_PUBLIC_HOST');

const canonicalHost =
  qrPublicHost ??
  (nextPublicAppUrl?.hostname ? nextPublicAppUrl.hostname.toLowerCase() : null) ??
  (expoPublicRoasterWebUrl?.protocol === 'https:' ? expoPublicRoasterWebUrl.hostname.toLowerCase() : null);

if (strict && !qrPublicHost) {
  addError('QR_PUBLIC_HOST is required for host consistency validation');
}

if (nextPublicAppUrl && canonicalHost && nextPublicAppUrl.hostname.toLowerCase() !== canonicalHost) {
  addError(
    `NEXT_PUBLIC_APP_URL host (${nextPublicAppUrl.hostname.toLowerCase()}) must match QR_PUBLIC_HOST (${canonicalHost})`
  );
}

if (expoPublicRoasterWebUrl) {
  const expoHost = expoPublicRoasterWebUrl.hostname.toLowerCase();

  if (strict && expoPublicRoasterWebUrl.protocol !== 'https:') {
    addError('EXPO_PUBLIC_ROASTER_WEB_URL must use https for universal link readiness');
  } else if (expoPublicRoasterWebUrl.protocol !== 'https:') {
    addWarning('EXPO_PUBLIC_ROASTER_WEB_URL is not https; universal links will not auto-verify');
  }

  if (canonicalHost && expoHost !== canonicalHost) {
    addError(`EXPO_PUBLIC_ROASTER_WEB_URL host (${expoHost}) must match QR_PUBLIC_HOST (${canonicalHost})`);
  }
}

validateStoreUrl(process.env.APP_STORE_URL?.trim(), 'APP_STORE_URL', [
  'apps.apple.com',
  'testflight.apple.com',
]);
validateStoreUrl(process.env.PLAY_STORE_URL?.trim(), 'PLAY_STORE_URL', ['play.google.com']);

const androidApplicationId = process.env.ANDROID_APPLICATION_ID?.trim() || 'com.anonymous.funcup';
const iosBundleId = process.env.IOS_BUNDLE_ID?.trim() || 'com.anonymous.funcup';
const appleTeamId =
  process.env.APPLE_TEAM_ID?.trim() || process.env.APPLE_APP_ID_PREFIX?.trim() || '';
const androidFingerprints = splitFingerprints(process.env.ANDROID_SHA256_CERT_FINGERPRINTS);

if (androidFingerprints.length === 0) {
  if (strict) {
    addError('ANDROID_SHA256_CERT_FINGERPRINTS is required to publish a valid assetlinks.json');
  } else {
    addWarning('ANDROID_SHA256_CERT_FINGERPRINTS is not set; assetlinks.json will be emitted as an empty array');
  }
}

for (const fingerprint of androidFingerprints) {
  if (!isValidFingerprint(fingerprint)) {
    addError(`Invalid Android SHA-256 certificate fingerprint: ${fingerprint}`);
  }
}

if (!appleTeamId) {
  if (strict) {
    addError('APPLE_TEAM_ID or APPLE_APP_ID_PREFIX is required to publish a valid apple-app-site-association');
  } else {
    addWarning(
      'APPLE_TEAM_ID / APPLE_APP_ID_PREFIX is not set; apple-app-site-association will be emitted without app bindings'
    );
  }
}

const assetLinks = androidFingerprints.length
  ? [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: androidApplicationId,
          sha256_cert_fingerprints: androidFingerprints,
        },
      },
    ]
  : [];

const appleAppSiteAssociation = {
  applinks: {
    apps: [],
    details: appleTeamId
      ? [
          {
            appID: `${appleTeamId}.${iosBundleId}`,
            paths: ['/q/*'],
          },
        ]
      : [],
  },
};

if (!checkOnly) {
  fs.mkdirSync(wellKnownDir, { recursive: true });
  fs.writeFileSync(assetLinksPath, `${JSON.stringify(assetLinks, null, 2)}\n`);
  fs.writeFileSync(aasaRootPath, `${JSON.stringify(appleAppSiteAssociation, null, 2)}\n`);
  fs.writeFileSync(aasaWellKnownPath, `${JSON.stringify(appleAppSiteAssociation, null, 2)}\n`);
}

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

if (checkOnly) {
  console.log(
    `QR link readiness check passed for host ${canonicalHost ?? '<unresolved>'} (${androidApplicationId}, ${iosBundleId})`
  );
} else {
  console.log(
    `Prepared QR association assets for host ${canonicalHost ?? '<unresolved>'} (${androidApplicationId}, ${iosBundleId})`
  );
}
