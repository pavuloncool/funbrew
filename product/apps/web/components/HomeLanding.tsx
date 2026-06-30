import Link from 'next/link';

import PublicInfoPage, { PUBLIC_BODY_COPY_CLASS } from '@/components/public/PublicInfoPage';
import PublicLeadForm from '@/components/public/PublicLeadForm';

const OVERVIEW_LINKS = [
  {
    href: '/about',
    label: 'About',
    description: 'Understand the roaster data loop, QR identity, and consumer feedback layer.',
  },
  {
    href: '/support',
    label: 'Support',
    description: 'Set up your first batch, print codes, and publish with confidence.',
  },
  {
    href: '/contact',
    label: 'Contact',
    description: 'Send your details and we will follow up with access or partnership details.',
  },
  {
    href: '/business',
    label: 'Business',
    description: 'Present accessories and equipment offers to a specialty coffee audience.',
  },
] as const;

const LOOP_STEPS = [
  {
    step: '01',
    title: 'Publish coffee data',
    copy: 'Enter origin, process, roast batch, and tasting context in one structured workflow.',
  },
  {
    step: '02',
    title: 'Generate a QR identity',
    copy: 'Every batch gets a scannable identity that links the package to the digital product.',
  },
  {
    step: '03',
    title: 'Collect consumer logs',
    copy: 'Consumers scan from the package, rate the cup, and leave structured tasting notes.',
  },
  {
    step: '04',
    title: 'Read the analytics',
    copy: 'You get a feedback layer that shows what people actually experienced and liked.',
  },
] as const;

const FEATURE_PILLS = [
  'Add coffee batch',
  'Generate QR',
  'Collect tasting logs',
  'Analyse user feedback',
] as const;

export default function HomeLanding() {
  return (
    <PublicInfoPage
      eyebrow="For specialty roasters"
      title="Turn coffee batches into structured product data"
      intro="fun•brew connects roaster publishing on web with consumer tasting on mobile. Publish a batch, print its QR identity, and read back structured feedback from the people drinking it."
      actions={[
        { href: '/about', label: 'About', variant: 'secondary' },
        { href: '/support', label: 'Support', variant: 'secondary' },
        { href: '/contact', label: 'Contact', variant: 'primary' },
        { href: '/business', label: 'Business', variant: 'secondary' },
      ]}
      aside={
        <PublicLeadForm
          formTitle="Contact"
          formDescription="Leave your details and we will follow up with roaster access, onboarding, or partnership details."
          submitLabel="Send message"
          successMessage="Thanks. We will contact you soon."
          messagePlaceholder="What do you want to achieve with fun•brew? (optional)"
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {OVERVIEW_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-4 shadow-vs-sm transition hover:-translate-y-0.5 hover:bg-vs-surface"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-vs-text-muted">
              {item.label}
            </p>
            <p className={`mt-2 font-medium text-vs-text-primary ${PUBLIC_BODY_COPY_CLASS}`}>
              {item.description}
            </p>
          </Link>
        ))}
      </div>

      <section className="space-y-4 rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm sm:p-6">
        <div className="flex flex-wrap gap-3">
          {FEATURE_PILLS.map((pill) => (
            <span
              key={pill}
              className="rounded-full border-2 border-vs-border-strong bg-vs-surface px-4 py-1 text-sm font-semibold text-vs-text-primary shadow-vs-sm"
            >
              {pill}
            </span>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {LOOP_STEPS.map((item) => (
            <article
              key={item.step}
              className="rounded-vs-md border border-vs-border-default bg-vs-surface p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-vs-text-muted">
                Step {item.step}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-vs-text-primary">{item.title}</h2>
              <p className={`mt-2 ${PUBLIC_BODY_COPY_CLASS}`}>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicInfoPage>
  );
}
