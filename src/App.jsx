import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ThemeProvider } from '@/lib/themeContext';
import { HeaderHideProvider } from '@/lib/HeaderHideContext';
import AppLayout from '@/components/layout/AppLayout';
import React, { lazy, Suspense } from 'react';

// Lazy load pages for faster initial load
const HomePage = lazy(() => import('@/pages/HomePage'));
const BibleReader = lazy(() => import('@/pages/BibleReader'));
const GospelPage = lazy(() => import('@/pages/GospelPage'));
const ResourcesPage = lazy(() => import('@/pages/ResourcesPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContentsPage = lazy(() => import('@/pages/ContentsPage.jsx'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage.jsx'));
const SearchPage = lazy(() => import('@/pages/SearchPage.jsx'));
const SavedVersesPage = lazy(() => import('@/pages/SavedVersesPage.jsx'));
const RefreshCache = lazy(() => import('@/pages/RefreshCache.jsx'));

// No spinner — render nothing while a chunk loads (usually instant once cached)
const PageLoader = () => null;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    // Render nothing during auth resolution — avoids black flash
    return null;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes location={location}>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
        <Route path="/read" element={<Suspense fallback={<PageLoader />}><BibleReader /></Suspense>} />
        <Route path="/gospel" element={<Suspense fallback={<PageLoader />}><GospelPage /></Suspense>} />
        <Route path="/resources" element={<Suspense fallback={<PageLoader />}><ResourcesPage /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="/contents" element={<Suspense fallback={<PageLoader />}><ContentsPage /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
        <Route path="/search" element={<Suspense fallback={<PageLoader />}><SearchPage /></Suspense>} />
        <Route path="/saved" element={<Suspense fallback={<PageLoader />}><SavedVersesPage /></Suspense>} />
        <Route path="/refresh-cache" element={<Suspense fallback={<PageLoader />}><RefreshCache /></Suspense>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HeaderHideProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </HeaderHideProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App