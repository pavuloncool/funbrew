import Link from 'next/link';

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8 text-neutral-900">
      <Link href="/" className="mb-6 inline-block text-sm text-neutral-600 underline hover:text-neutral-900">
        ← Start
      </Link>
      <h1 className="text-2xl font-semibold text-neutral-900">Skanuj kod QR</h1>
      <p className="mt-2 text-neutral-700">Zeskanuj kod QR z opakowania kawy</p>
    </div>
  );
}
