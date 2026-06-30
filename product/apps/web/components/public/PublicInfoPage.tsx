import Link from 'next/link';
import type { ReactNode } from 'react';

type PublicAction = {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary';
};

type PublicInfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  actions?: PublicAction[];
  children?: ReactNode;
  aside?: ReactNode;
};

export const PUBLIC_BODY_COPY_CLASS = 'text-base leading-relaxed text-vs-text-secondary sm:text-lg';

function actionClass(variant: PublicAction['variant'] = 'secondary'): string {
  return variant === 'primary'
    ? 'vs-button-primary inline-flex items-center text-sm font-semibold sm:text-base'
    : 'vs-button-secondary inline-flex items-center text-sm font-semibold sm:text-base';
}

export default function PublicInfoPage({
  eyebrow,
  title,
  intro,
  actions = [],
  children,
  aside,
}: PublicInfoPageProps) {
  const hasAside = Boolean(aside);

  return (
    <main className="mx-auto w-full max-w-[1600px] border-x-2 border-vs-border-strong px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-12">
      <section
        className={`grid grid-cols-1 gap-8 border-2 border-vs-border-strong bg-vs-surface p-6 sm:p-10 ${
          hasAside ? 'lg:grid-cols-2 lg:items-start' : ''
        }`}
      >
        <div className="space-y-6">
          <p className="inline-flex rounded-full border-2 border-vs-border-strong bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-vs-text-primary shadow-vs-sm">
            {eyebrow}
          </p>
          <h1 className="max-w-[840px] font-display text-[40px] uppercase leading-[0.95] tracking-[-0.04em] text-vs-text-primary sm:text-[52px] lg:text-[64px]">
            {title}
          </h1>
          <p className={`max-w-[720px] ${PUBLIC_BODY_COPY_CLASS}`}>
            {intro}
          </p>

          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {actions.map(action => (
                <Link key={action.href} href={action.href} className={actionClass(action.variant)}>
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}

          {children}
        </div>

        {hasAside ? <div className="lg:self-start">{aside}</div> : null}
      </section>
    </main>
  );
}
