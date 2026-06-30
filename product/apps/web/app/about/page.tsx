import Link from 'next/link';

import PublicInfoPage, { PUBLIC_BODY_COPY_CLASS } from '@/components/public/PublicInfoPage';

const LOOP_COPY_CLASS = 'text-base leading-relaxed text-vs-text-secondary sm:text-lg';

const ABOUT_CARDS = [
  {
    title: 'Publish roaster data',
    copy: 'Enter origin, process, batch identity, roast date, and the story you want consumers to read.',
  },
  {
    title: 'Connect the QR identity',
    copy: 'Each package code resolves to one specific batch, so the physical product stays linked to the digital record.',
  },
  {
    title: 'Capture consumer feedback',
    copy: 'Consumers scan from the package, rate the cup, and leave tasting notes and brewing context.',
  },
  {
    title: 'Turn logs into analytics',
    copy: 'You get batch-level insight about rating patterns, flavour notes, and what people actually brewed.',
  },
] as const;

export default function AboutPage() {
  return (
    <PublicInfoPage
      eyebrow="About fun•brew"
      title="What fun•brew does for roasters"
      intro="fun•brew is both a roasters' dashboard and a buyers' app. Roasters use 'Roaster Hub' to add coffee data to a QR code, the buyers scan the QR code from the coffee bag and log their tasting, and fun•brew returns structured tasting feedback and analytics. Thus, fun•brew creates a digital data bridge between the coffee releases and the buyers' experience."
      actions={[
        { href: '/support', label: 'Support', variant: 'secondary' },
        { href: '/contact', label: 'Contact', variant: 'primary' },
      ]}
      aside={
        <div className="space-y-4">
          <div className="rounded-vs-md border-2 border-vs-border-strong bg-vs-surface p-5 shadow-vs-sm">
            <p className="text-xl font-semibold uppercase tracking-[0.16em] text-vs-text-muted">
              The loop
            </p>
            <ul className="mt-4 space-y-0">
              <li className={LOOP_COPY_CLASS}>
                <strong className="text-vs-text-primary">Roaster data:</strong> origin, process,
                batch, and story.
              </li>
              <li className={LOOP_COPY_CLASS}>
                <strong className="text-vs-text-primary">QR identity:</strong> one code per
                published batch.
              </li>
              <li className={LOOP_COPY_CLASS}>
                <strong className="text-vs-text-primary">Consumer scan:</strong> rating,
                tasting notes, brew method.
              </li>
              <li className={LOOP_COPY_CLASS}>
                <strong className="text-vs-text-primary">Analytics:</strong> aggregated signals
                that help you decide what to roast next.
              </li>
            </ul>
          </div>

          <div className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
            <p className="text-xl font-semibold uppercase tracking-[0.16em] text-vs-text-muted">
              Built for
            </p>
            <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>
              Verified specialty roasters who want to publish product data, track consumer
              experience, and use the same backend as the mobile tasting flow.
            </p>
            <p className="mt-4">
              <Link href="/business" className="vs-button-secondary inline-flex text-sm font-semibold">
                Commercial partners
              </Link>
            </p>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {ABOUT_CARDS.map((item) => (
          <article
            key={item.title}
            className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm"
          >
            <h2 className="text-xl font-semibold text-vs-text-primary">{item.title}</h2>
            <p className={`mt-2 ${PUBLIC_BODY_COPY_CLASS}`}>{item.copy}</p>
          </article>
        ))}
      </div>
    </PublicInfoPage>
  );
}
