import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Loader } from './components/ui/feedback/Loader';
import { usePrefsStore, applyThemeClass } from './stores/prefsStore';

// ─── Lazy loaded pages ────────────────────────────────────────────────────────
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage  = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ProjectForm   = lazy(() => import('./pages/ProjectForm'));
const SettingsPage  = lazy(() => import('./pages/SettingsPage'));
const LoginPage     = lazy(() => import('./pages/LoginPage'));
const UsersPage     = lazy(() => import('./pages/UsersPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const ReportsPage   = lazy(() => import('./pages/ReportsPage'));

// ─── Mapping dashboard par défaut → route ────────────────────────────────────

const HOME_ROUTE_MAP: Record<string, string> = {
  'Tableau de bord': '/dashboard',
  'Projets':         '/projects',
  'Documents':       '/documents',
  'Utilisateurs':    '/users',
  'Paramètres':      '/settings',
};

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const theme        = usePrefsStore(s => s.theme);
  const reduceMotion = usePrefsStore(s => s.a11y.reduceMotion);
  const homePage     = usePrefsStore(s => s.display.homePage);

  // Applique la classe .dark sur <html> dès le montage et à chaque changement
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // Suit la préférence système en mode 'auto'
  useEffect(() => {
    if (theme !== 'auto') return;
    const media   = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeClass('auto');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  // Applique/retire .reduce-motion sur <html>
  useEffect(() => {
    const root = document.documentElement;
    if (reduceMotion) root.classList.add('reduce-motion');
    else              root.classList.remove('reduce-motion');
  }, [reduceMotion]);

  const homeRoute = HOME_ROUTE_MAP[homePage] ?? '/dashboard';

  return (
    <BrowserRouter>
      <Suspense fallback={<Loader fullScreen text="Chargement de l'application..." />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to={homeRoute} replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects"  element={<ProjectsPage />} />
            <Route path="/projects/new" element={<ProjectForm />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/settings"  element={<SettingsPage />} />
            <Route path="/users"     element={<UsersPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/reports"   element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
