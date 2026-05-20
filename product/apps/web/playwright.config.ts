import { defineConfig } from '@playwright/test';
// @ts-ignore - module is provided by Next.js runtime dependency
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const baseURL = process.env.WEB_BASE_URL ?? 'http://127.0.0.1:3000';

const devPort = (() => {
  try {
    return new URL(baseURL).port || '3000';
  } catch {
    return '3000';
  }
})();

/**
 * Next dev must expose browser-reachable URLs. SUPABASE_URL from the CLI often
 * points at `kong` (only resolvable inside the Docker stack).
 */
function supabaseUrlForNextDevServer(): string {
  const nextPublic = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (nextPublic) return nextPublic;
  const cli = process.env.SUPABASE_URL ?? '';
  if (cli.includes('kong')) return 'http://127.0.0.1:54321';
  return cli || 'http://127.0.0.1:54321';
}

function supabaseAnonForNextDevServer(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    ''
  );
}

const supabaseUrlForBrowser = supabaseUrlForNextDevServer();
const supabaseAnonForBrowser = supabaseAnonForNextDevServer();

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  webServer: {
    command: `pnpm exec next dev -p ${devPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrlForBrowser,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonForBrowser,
    },
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  reporter: [['list']],
});
