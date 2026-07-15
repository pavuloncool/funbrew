'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { resolvePublicHubCtaTarget } from '@/src/lib/publicEntryRouting';
import { isMarketingRoute, isPublicRoute } from '@/src/lib/publicRoutes';

// MARKETING_NAV_ITEMS is temporarily expired in favor of HOME_NAV_ITEMS.
// If this decision holds in the future, MARKETING_NAV_ITEMS can be removed entirely
// as a leftover from an expired project branch.
const MARKETING_NAV_ITEMS = [
  { label: 'Support', href: '/support' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Business', href: '/business' },
] as const;

const HOME_NAV_ITEMS = [
  { type: 'link', label: 'Stan na dzisiaj', href: '#stan-zero' },
  { type: 'link', label: 'Co badamy?', href: '#co-testujemy' },
  { type: 'link', label: 'Jak to robimy?', href: '#jak-to-robimy' },
  { type: 'action', action: 'publicHub', label: 'Roaster Hub' },
] as const;

const PINK_HEADER_BUTTON_CLASS =
  'vs-button-primary min-w-[9.75rem] shrink-0 justify-center whitespace-nowrap bg-vs-hero-primary hover:bg-vs-hero-primary/90 text-vs-text-primary';
const PINK_HEADER_SECONDARY_BUTTON_CLASS =
  'vs-button-secondary bg-vs-hero-primary hover:bg-vs-hero-primary/90 text-vs-text-primary';
const STICKY_HEADER_FALLBACK_BOTTOM = 74;

function getNavLinkClass(pathname: string, href: string): string {
  const isActive = pathname === href && !MARKETING_NAV_ITEMS.some(item => item.href === href);
  return `inline-flex items-center text-[24px] font-medium text-vs-text-primary transition hover:underline ${
    isActive ? 'underline decoration-2 underline-offset-4' : ''
  }`;
}

function getHomeNavHref(href: string, isHomePage: boolean): string {
  return isHomePage ? href : `/${href}`;
}

export default function WebHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hubCtaLoading, setHubCtaLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isHomePage = pathname === '/';
  const isLoginPage = pathname === '/login';
  const isMarketingEntry = isMarketingRoute(pathname);
  const isCompactPublicHeader = isPublicRoute(pathname) && !isMarketingEntry && !isLoginPage;
  const showPublicHubNavAction = isHomePage || isMarketingEntry || isLoginPage;

  useEffect(() => {
    setLoading(false);
    setHubCtaLoading(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function updateBackToTopVisibility() {
      const stanZeroSection = document.getElementById('stan-zero');
      if (!stanZeroSection) {
        setShowBackToTop(false);
        return;
      }

      const header = document.querySelector<HTMLElement>('[data-web-header]');
      const headerBottom = header?.getBoundingClientRect().bottom ?? STICKY_HEADER_FALLBACK_BOTTOM;

      setShowBackToTop(stanZeroSection.getBoundingClientRect().top <= headerBottom);
    }

    updateBackToTopVisibility();
    window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
    window.addEventListener('resize', updateBackToTopVisibility);

    return () => {
      window.removeEventListener('scroll', updateBackToTopVisibility);
      window.removeEventListener('resize', updateBackToTopVisibility);
    };
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const menu = mobileMenuRef.current;
      if (!menu || menu.contains(event.target as Node)) {
        return;
      }

      setMobileMenuOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    setLoading(true);
    router.push('/');
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

  function handleBackToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const backToTopButton = showBackToTop ? (
    <button
      type="button"
      onClick={handleBackToTop}
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border-2 border-vs-border-strong bg-vs-elevated/90 px-4 py-2 text-sm leading-none text-vs-text-primary opacity-90 shadow-vs-md backdrop-blur transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vs-border-strong sm:bottom-6 sm:right-6 sm:text-base"
      aria-label="Up"
    >
      <span className="text-[1em] font-black leading-none" aria-hidden>
        ↑
      </span>
      <span className="font-semibold leading-none">Up</span>
    </button>
  ) : null;

  if (isCompactPublicHeader) {
    return (
      <>
        <header
          data-web-header
          className="sticky top-0 z-50 w-full border-b-2 border-vs-border-strong bg-vs-elevated"
        >
          <div className="mx-auto flex h-[74px] w-full max-w-[1600px] items-center border-x-2 border-vs-border-strong px-5 sm:px-8">
            <button
              type="button"
              className="font-display text-[42px] leading-none tracking-[-0.04em] text-vs-text-primary sm:text-[52px]"
              onClick={() => router.push('/')}
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
        {backToTopButton}
      </>
    );
  }

  return (
    <>
      <header
        data-web-header
        className="sticky top-0 z-50 w-full border-b-2 border-vs-border-strong bg-vs-elevated"
      >
        <div className="mx-auto flex min-h-[74px] w-full max-w-[1600px] items-center gap-3 border-x-2 border-vs-border-strong px-4 min-[380px]:gap-4 min-[380px]:px-5 sm:px-8">
          <Link
            href="/"
            className="shrink-0 font-display text-[42px] leading-none tracking-[-0.04em] text-vs-text-primary sm:text-[52px]"
          >
            fun•brew
          </Link>

          <nav className="ml-12 hidden items-center gap-8 min-[1100px]:flex lg:gap-10">
            {HOME_NAV_ITEMS.map((item) =>
              item.type === 'action' && showPublicHubNavAction ? (
                <button
                  key={item.action}
                  type="button"
                  onClick={() => void handlePublicHubCta()}
                  className={`text-[15px] font-semibold sm:text-[16px] ${PINK_HEADER_BUTTON_CLASS}`}
                  disabled={hubCtaLoading}
                >
                  {hubCtaLoading ? 'Opening…' : item.label}
                </button>
              ) : item.type === 'action' ? null : isHomePage ? (
                <a key={item.href} href={item.href} className={getNavLinkClass(pathname, item.href)}>
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={getHomeNavHref(item.href, isHomePage)}
                  className={getNavLinkClass(pathname, item.href)}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <div ref={mobileMenuRef} className="relative min-[1100px]:hidden">
              <button
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-haspopup="menu"
                onClick={() => setMobileMenuOpen(prev => !prev)}
                className="shrink-0 rounded-full border-2 border-vs-border-strong bg-vs-elevated px-4 py-2 text-sm font-semibold text-vs-text-primary shadow-vs-sm"
              >
                Menu
              </button>
              <div
                className={`absolute right-0 top-full z-20 mt-3 w-[min(18rem,calc(100vw-2.5rem))] rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-3 shadow-vs-md ${
                  mobileMenuOpen ? 'block' : 'hidden'
                }`}
              >
                <nav className="grid gap-2">
                  {HOME_NAV_ITEMS.map((item) =>
                    item.type === 'action' && showPublicHubNavAction ? (
                      <button
                        key={item.action}
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          void handlePublicHubCta();
                        }}
                        className={`justify-center text-base font-semibold ${PINK_HEADER_BUTTON_CLASS}`}
                        disabled={hubCtaLoading}
                      >
                        {hubCtaLoading ? 'Opening…' : item.label}
                      </button>
                    ) : item.type === 'action' ? null : isHomePage ? (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="inline-flex items-center rounded-vs-md border border-transparent px-3 py-2 text-base font-medium text-vs-text-primary hover:border-vs-border-default hover:bg-vs-surface"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={item.href}
                        href={getHomeNavHref(item.href, isHomePage)}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`inline-flex items-center rounded-vs-md border border-transparent px-3 py-2 text-base font-medium text-vs-text-primary hover:border-vs-border-default hover:bg-vs-surface ${
                          pathname === item.href ? 'bg-vs-surface underline decoration-2 underline-offset-4' : ''
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  )}
                </nav>
              </div>
            </div>

            {/* <div className="flex h-[74px] items-center border-l-2 border-vs-border-strong px-6">
              <span className="text-[22px] font-semibold">EN</span>
            </div> */}
            {showPublicHubNavAction ? (
              <>
                {/* <a href="#zgloszenie" className="vs-button-primary text-[15px] font-semibold sm:text-[16px]">
                  Zgłoś palarnię
                </a> */}
              </>
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
      {backToTopButton}
    </>
  );
}
