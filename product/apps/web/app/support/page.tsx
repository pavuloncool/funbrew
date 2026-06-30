import Link from 'next/link';

import PublicInfoPage, { PUBLIC_BODY_COPY_CLASS } from '@/components/public/PublicInfoPage';

const SUPPORT_STEPS = [
  {
    title: 'Prepare the roaster profile',
    copy: 'Verify the account, confirm the company details, and make sure the roaster name is ready for public display.',
  },
  {
    title: 'Create and publish a batch',
    copy: 'Add the coffee, choose the batch identity, and send the data to the public product flow.',
  },
  {
    title: 'Print the QR code',
    copy: 'Place the code on packaging so consumers can reach the right batch from the physical product.',
  },
  {
    title: 'Read feedback after launch',
    copy: 'Use the analytics view to see ratings, tasting notes, and batch-level patterns.',
  },
] as const;

export default function SupportPage() {
  return (
    <PublicInfoPage
      eyebrow="Support"
      title="Support for setup, publishing, and QR flow"
      intro="Use this page if you are preparing your first batch or rolling fun•brew out across a roaster catalogue. The sequence stays simple: publish the data, print the QR, and read the consumer feedback."
      actions={[
        { href: '/about', label: 'About', variant: 'secondary' },
        { href: '/contact', label: 'Contact', variant: 'primary' },
      ]}
      aside={
        <div className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
          <p className="text-xl font-semibold uppercase tracking-[0.16em] text-vs-text-muted">
            Need help fast?
          </p>
          <p className={`mt-3 ${PUBLIC_BODY_COPY_CLASS}`}>
            Send your roaster name and batch ID. Include a screenshot if QR resolution is
            failing. Use the contact form for setup or launch questions.
          </p>
          <p className="mt-5">
            <Link href="/contact" className="vs-button-primary inline-flex text-sm font-semibold">
              Contact support
            </Link>
          </p>
        </div>
      }
    >
      <div className="grid gap-4">
        {SUPPORT_STEPS.map((item, index) => (
          <article
            key={item.title}
            className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-vs-text-muted">
              Step {String(index + 1).padStart(2, '0')}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-vs-text-primary">{item.title}</h2>
            <p className={`mt-2 ${PUBLIC_BODY_COPY_CLASS}`}>{item.copy}</p>
          </article>
        ))}
      </div>
    </PublicInfoPage>
  );
}
