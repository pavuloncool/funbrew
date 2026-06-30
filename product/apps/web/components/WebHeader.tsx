'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { resolvePublicHubCtaTarget } from '@/src/lib/publicEntryRouting';
import { isMarketingRoute, isPublicRoute } from '@/src/lib/publicRoutes';

const MARKETING_NAV_ITEMS = [
  { label: 'Support', href: '/support' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Business', href: '/business' },
] as const;

const PINK_HEADER_BUTTON_CLASS =
  'vs-button-primary bg-vs-hero-primary hover:bg-vs-hero-primary/90 text-vs-text-primary';
const PINK_HEADER_SECONDARY_BUTTON_CLASS =
  'vs-button-secondary bg-vs-hero-primary hover:bg-vs-hero-primary/90 text-vs-text-primary';

function getNavLinkClass(pathname: string, href: string): string {
  const isActive = pathname === href;
  return `inline-flex items-center text-[24px] font-medium text-vs-text-primary transition hover:underline ${
    isActive ? 'underline decoration-2 underline-offset-4' : ''
  }`;
}

export default function WebHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hubCtaLoading, setHubCtaLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMarketingEntry = isMarketingRoute(pathname);
  const isCompactPublicHeader = isPublicRoute(pathname) && !isMarketingEntry;

  useEffect(() => {
    setLoading(false);
    setHubCtaLoading(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setLoading(true);
    router.push('/home');
    try {
      await supabaseBrowser.auth.signOut();
      router.refresh();
    } catch {
      // Keep the user on current screen when sign-out fails, but always unlock the button.
    } finally {
      setLoading(false);
    }
  }

  async function handlePublicHubCta() {
    setHubCtaLoading(true);
    try {
      const target = await resolvePublicHubCtaTarget();
      router.push(target);
    } finally {
      setHubCtaLoading(false);
    }
  }

  if (isCompactPublicHeader) {
    return (
      <header className="w-full border-b-2 border-vs-border-strong bg-vs-elevated">
        <div className="mx-auto flex h-[74px] w-full max-w-[1600px] items-center border-x-2 border-vs-border-strong px-5 sm:px-8">
          <button
            type="button"
            className="font-display text-[42px] leading-none tracking-[-0.04em] text-vs-text-primary sm:text-[52px]"
            onClick={() => router.push('/home')}
          >
            fun•brew
          </button>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => void handlePublicHubCta()}
              className={`text-[15px] font-semibold sm:text-[16px] ${PINK_HEADER_BUTTON_CLASS}`}
              disabled={hubCtaLoading}
            >
              {hubCtaLoading ? 'Opening…' : 'Roaster Hub'}
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full border-b-2 border-vs-border-strong bg-vs-elevated">
      <div className="mx-auto flex min-h-[74px] w-full max-w-[1600px] items-center gap-4 border-x-2 border-vs-border-strong px-5 sm:px-8">
        <Link
          href="/home"
          className="font-display text-[42px] leading-none tracking-[-0.04em] text-vs-text-primary sm:text-[52px]"
        >
          fun•brew
        </Link>

        <nav className="ml-12 hidden items-center gap-8 md:flex lg:gap-10">
          {MARKETING_NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={getNavLinkClass(pathname, item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <div className="relative md:hidden">
            <button
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-haspopup="menu"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="rounded-full border-2 border-vs-border-strong bg-vs-elevated px-4 py-2 text-sm font-semibold text-vs-text-primary shadow-vs-sm"
            >
              Menu
            </button>
            <div
              className={`absolute right-0 top-full z-20 mt-3 w-[min(18rem,calc(100vw-2.5rem))] rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-3 shadow-vs-md ${
                mobileMenuOpen ? 'block' : 'hidden'
              }`}
            >
              <nav className="grid gap-2">
                {MARKETING_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`inline-flex items-center rounded-vs-md border border-transparent px-3 py-2 text-base font-medium text-vs-text-primary hover:border-vs-border-default hover:bg-vs-surface ${
                      pathname === item.href ? 'bg-vs-surface underline decoration-2 underline-offset-4' : ''
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="hidden h-[74px] items-center border-l-2 border-vs-border-strong px-6 md:flex">
            <span className="text-[22px] font-semibold">EN</span>
          </div>
          {isMarketingEntry ? (
            <button
              type="button"
              onClick={() => void handlePublicHubCta()}
              className={`text-[15px] font-semibold sm:text-[16px] ${PINK_HEADER_BUTTON_CLASS}`}
              disabled={hubCtaLoading}
            >
              {hubCtaLoading ? 'Opening…' : 'Roaster Hub'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className={`text-[16px] font-semibold ${PINK_HEADER_SECONDARY_BUTTON_CLASS}`}
              disabled={loading}
            >
              {loading ? 'Logging out…' : 'Log out'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
