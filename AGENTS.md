# Funcup Agent Instructions

## Protected Localhost Startup Workflow

Do not modify the `localhost:3000` startup workflow without explicit user approval in the current task.

This protected workflow includes:
- `pnpm run dev`
- `package.json` root `dev` script
- `product/scripts/dev-workspace.sh`
- `product/scripts/ensure-local-supabase-ready.sh`
- `product/scripts/mobile-functions-smoke-check.sh`
- `product/apps/web/scripts/sync-supabase-env-local.sh`
- `product/apps/consumer-mobile/scripts/sync-supabase-env-local.sh`
- the `localhost:3000` startup instructions in `meta/docs/app run commands`

Allowed without approval:
- reading and diagnosing these files;
- running non-destructive checks;
- reporting a proposed fix.

Not allowed without approval:
- changing the command shape or behavior of `pnpm run dev`;
- changing the `funcup-web` tmux orchestration;
- changing health-check gates used by the default web startup;
- changing automatic env sync for the default local workflow;
- changing documentation that describes the default `localhost:3000` startup method.

If a task appears to require touching this workflow, stop first and ask the user for explicit approval.
