import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import RouteShell from '../components/RouteShell';
import './globals.css';
import Providers from './providers';

const splineSansBody = localFont({
  src: [
    { path: './fonts/spline-sans/SplineSans-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/spline-sans/SplineSans-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/spline-sans/SplineSans-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/spline-sans/SplineSans-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
});

const splineSansDisplay = localFont({
  src: [
    { path: './fonts/spline-sans/SplineSans-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/spline-sans/SplineSans-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/spline-sans/SplineSans-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
});

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en" className={`${splineSansBody.variable} ${splineSansDisplay.variable}`}>
      <body className="bg-vs-canvas font-sans text-vs-text-primary">
        <Providers>
          <RouteShell>{props.children}</RouteShell>
        </Providers>
      </body>
    </html>
  );
}
