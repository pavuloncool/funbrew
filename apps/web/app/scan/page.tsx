import Link from 'next/link';

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-vs-surface p-8 text-vs-text-primary">
      <Link href="/" className="mb-6 inline-block text-sm text-vs-text-secondary underline hover:text-vs-text-primary">
        ← Start
      </Link>
      <h1 className="text-2xl font-semibold text-vs-text-primary">Skanuj kod QR</h1>
      <p className="mt-2 text-vs-text-secondary">Zeskanuj kod QR z opakowania kawy</p>
    </div>
  );
}
