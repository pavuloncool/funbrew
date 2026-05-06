import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnimatedSplash from './AnimatedSplash';
import { ErrorBoundary } from './ErrorBoundary';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import CoffeePage from './pages/CoffeePage';
import HubPage from './pages/HubPage';
import ProfilePage from './pages/ProfilePage';
import AuthCallbackPage from './pages/AuthCallbackPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

/** Splash: `ready` resetuje się przy pełnym reloadzie. Linki wewnętrzne muszą być `<Link to>` (RRD), nie `<a href>` — inaczej każda nawigacja przeładowuje SPA i powtarza animację. */
function AppContent() {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready && <AnimatedSplash onFinish={() => setReady(true)} />}
      {ready && (
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/coffee/:id" element={<CoffeePage />} />
          <Route path="/hub" element={<HubPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}