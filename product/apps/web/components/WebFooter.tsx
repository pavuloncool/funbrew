import Link from 'next/link';

export default function WebFooter() {
  return (
    <footer className="w-full border-t-2 border-vs-border-strong bg-vs-elevated">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between border-x-2 border-vs-border-strong px-8 py-4 text-[14px] text-vs-text-secondary">
        <span>Copyright 2026: fun•brew</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="font-medium text-vs-text-primary underline-offset-4 hover:underline">
            Polityka prywatności
          </Link>
          <span className="font-medium text-vs-text-primary">Made in Europe.</span>
        </div>
      </div>
    </footer>
  );
}
