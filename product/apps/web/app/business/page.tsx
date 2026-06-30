import Link from 'next/link';

import PublicInfoPage, { PUBLIC_BODY_COPY_CLASS } from '@/components/public/PublicInfoPage';
import PublicLeadForm from '@/components/public/PublicLeadForm';

const BUSINESS_OFFERS = [
  {
    title: 'Product storytelling',
    copy: 'Show your grinders, brewers, scales, filters, and accessories next to the coffee experience they support.',
  },
  {
    title: 'Specialty audience fit',
    copy: 'Reach roasters, café operators, festival visitors, and specialty coffee people who already care about quality gear.',
  },
  {
    title: 'Launch and event moments',
    copy: 'Use co-marketing around new releases, trade events, and festival activations where coffee gear and coffee data meet.',
  },
  {
    title: 'Commercial conversations',
    copy: 'Keep the commercial motion lightweight: send the details, define the placement, and ship the offer with the coffee context.',
  },
] as const;

export default function BusinessPage() {
  return (
    <PublicInfoPage
      eyebrow="Business"
      title="Commercial partners for accessories and equipment"
      intro="If you build grinders, brewers, filters, scales, or other specialty coffee gear, fun•brew can put your offer in front of a roaster-led audience that already pays attention to coffee quality."
      actions={[
        { href: '/about', label: 'About', variant: 'secondary' },
        { href: '/contact', label: 'Contact', variant: 'primary' },
      ]}
      aside={
        <div className="lg:sticky lg:top-6">
          <PublicLeadForm
            formTitle="Partner inquiry"
            formDescription="Tell us what you make, where you want to show up, and whether you are planning an event, a launch, or a long-term placement."
            submitLabel="Start a partnership"
            successMessage="Thanks. We will contact you soon."
            messagePlaceholder="Tell us about the product or campaign you want to place. (optional)"
          />
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {BUSINESS_OFFERS.map((item) => (
          <article
            key={item.title}
            className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm"
          >
            <h2 className="text-lg font-semibold text-vs-text-primary sm:text-xl">{item.title}</h2>
            <p className={`mt-2 ${PUBLIC_BODY_COPY_CLASS}`}>{item.copy}</p>
          </article>
        ))}
      </div>

      <p className={PUBLIC_BODY_COPY_CLASS}>
        If you want to start with a lighter touch, send the details through the{' '}
        <Link href="/contact" className="font-semibold text-vs-text-primary underline">
          contact form
        </Link>
        .
      </p>
    </PublicInfoPage>
  );
}
