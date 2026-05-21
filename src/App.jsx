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
import { AnimatePresence, motion } from 'framer-motion';
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

// Loading component for lazy routes
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);


const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
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
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<PageWrapper><Suspense fallback={<PageLoader />}><HomePage /></Suspense></PageWrapper>} />
          <Route path="/read" element={<PageWrapper><Suspense fallback={<PageLoader />}><BibleReader /></Suspense></PageWrapper>} />
          <Route path="/gospel" element={<PageWrapper><Suspense fallback={<PageLoader />}><GospelPage /></Suspense></PageWrapper>} />
          <Route path="/resources" element={<PageWrapper><Suspense fallback={<PageLoader />}><ResourcesPage /></Suspense></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><Suspense fallback={<PageLoader />}><AboutPage /></Suspense></PageWrapper>} />
          <Route path="/contents" element={<PageWrapper><Suspense fallback={<PageLoader />}><ContentsPage /></Suspense></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></PageWrapper>} />
          <Route path="/search" element={<PageWrapper><Suspense fallback={<PageLoader />}><SearchPage /></Suspense></PageWrapper>} />
          <Route path="/saved" element={<PageWrapper><Suspense fallback={<PageLoader />}><SavedVersesPage /></Suspense></PageWrapper>} />

          <Route path="/refresh-cache" element={<PageWrapper><Suspense fallback={<PageLoader />}><RefreshCache /></Suspense></PageWrapper>} />

        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
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