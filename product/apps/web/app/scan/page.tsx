import Link from 'next/link';

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-vs-surface p-8 text-vs-text-primary">
      <Link href="/" className="mb-6 inline-block text-sm text-vs-text-secondary underline hover:text-vs-text-primary">
        ← Start
      </Link>
      <h1 className="text-2xl font-semibold text-vs-text-primary">Open a fun•brew QR</h1>
      <p className="mt-2 max-w-[560px] text-vs-text-secondary">
        This web route is compatibility-only. Use your phone camera or a QR scanner to open the public coffee page linked from the label.
      </p>
    </div>
  );
}
