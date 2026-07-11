import PublicInfoPage from '@/components/public/PublicInfoPage';
import PublicLeadForm from '@/components/public/PublicLeadForm';

export default function ContactPage() {
  return (
    <PublicInfoPage
      eyebrow="Contact"
      title="Talk to fun•brew"
      intro={
        <>
          Learn how your clients brew your coffee.
          <br />
          Up your game and integrate consumer feedback in your product.
          <br />
          Find out how fun•brew turns consumer experience into actionable insights.
          <br />
          Use the details below or send us a message using the contact form.
        </>
      }
      aside={
        <PublicLeadForm
          formTitle="Contact"
          submitLabel="Send message"
          successMessage="Thanks. We will contact you soon."
        />
      }
    >
      <div className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm sm:p-6">
        <h2 className="font-display text-[28px] uppercase leading-none tracking-[-0.03em] text-vs-text-primary sm:text-[32px]">
          Contact details
        </h2>
        <div className="mt-4 space-y-3 text-base font-medium text-vs-text-primary sm:text-lg">
          <p>
            <span className="font-semibold">Email:</span>{' '}
            <a href="mailto:roasters@funbrew.site" className="underline">
              roasters@funbrew.site
            </a>
          </p>
          <p>
            <span className="font-semibold">WhatsApp:</span>{' '}
            <a href="https://wa.me/48691810000" className="underline">
              +48 691 810 000
            </a>
          </p>
        </div>
      </div>
    </PublicInfoPage>
  );
}
