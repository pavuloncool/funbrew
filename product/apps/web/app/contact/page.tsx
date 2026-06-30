import PublicInfoPage from '@/components/public/PublicInfoPage';
import PublicLeadForm from '@/components/public/PublicLeadForm';

const CONTACT_TOPICS = [
  'roaster onboarding',
  'batch publishing',
  'QR rollout',
  'consumer feedback analytics',
  'commercial partnerships',
] as const;

export default function ContactPage() {
  return (
    <PublicInfoPage
      eyebrow="Contact"
      title="Talk to fun•brew"
      intro="Use this form if you are a roaster, event organizer, or commercial partner and want to discuss onboarding, launch timing, or a partnership."
      actions={[
        { href: '/about', label: 'About', variant: 'secondary' },
        { href: '/support', label: 'Support', variant: 'secondary' },
        { href: '/business', label: 'Business', variant: 'primary' },
      ]}
      aside={
        <PublicLeadForm
          formTitle="Contact"
          formDescription="Tell us what you want to launch, and mention the part of the coffee loop you need help with."
          submitLabel="Send message"
          successMessage="Thanks. We will contact you soon."
          messagePlaceholder="Mention your roaster, event, or partner use case. (optional)"
        />
      }
    >
      <div className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-vs-text-muted">
          Good topics for the form
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {CONTACT_TOPICS.map((topic) => (
            <span
              key={topic}
              className="rounded-full border-2 border-vs-border-strong bg-vs-surface px-4 py-1 text-sm font-semibold text-vs-text-primary shadow-vs-sm"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    </PublicInfoPage>
  );
}
