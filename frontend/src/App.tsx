import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './hooks/useAuth';
import { usePageMeta } from './hooks/usePageMeta';
import { Spinner } from './components/common';
import { Role } from './types';

const Login = React.lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const PublicHome = React.lazy(() =>
  import('./pages/PublicPages').then((module) => ({ default: module.PublicHome })),
);
const FeaturesPage = React.lazy(() =>
  import('./pages/PublicPages').then((module) => ({ default: module.FeaturesPage })),
);
const UseCasesPage = React.lazy(() =>
  import('./pages/PublicPages').then((module) => ({ default: module.UseCasesPage })),
);
const TechnologyPage = React.lazy(() =>
  import('./pages/PublicPages').then((module) => ({ default: module.TechnologyPage })),
);
const DemoPage = React.lazy(() =>
  import('./pages/PublicPages').then((module) => ({ default: module.DemoPage })),
);
const SugarcaneMonitoringPage = React.lazy(() =>
  import('./pages/PublicPages').then((module) => ({ default: module.SugarcaneMonitoringPage })),
);
const PrecisionAgricultureDashboardPage = React.lazy(() =>
  import('./pages/PublicPages').then((module) => ({ default: module.PrecisionAgricultureDashboardPage })),
);
const PublicNotFound = React.lazy(() =>
  import('./pages/PublicPages').then((module) => ({ default: module.PublicNotFound })),
);
const Dashboard = React.lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })),
);
const Fields = React.lazy(() => import('./pages/Fields').then((module) => ({ default: module.Fields })));
const FieldDetail = React.lazy(() =>
  import('./pages/FieldDetail').then((module) => ({ default: module.FieldDetail })),
);
const Environmental = React.lazy(() =>
  import('./pages/Environmental').then((module) => ({ default: module.Environmental })),
);
const IoTMonitoring = React.lazy(() =>
  import('./pages/IoTMonitoring').then((module) => ({ default: module.IoTMonitoring })),
);
const SatelliteMonitoring = React.lazy(() =>
  import('./pages/SatelliteMonitoring').then((module) => ({ default: module.SatelliteMonitoring })),
);
const Agronomy = React.lazy(() =>
  import('./pages/Agronomy').then((module) => ({ default: module.Agronomy })),
);
const AIRecommendations = React.lazy(() =>
  import('./pages/AIRecommendations').then((module) => ({ default: module.AIRecommendations })),
);
const Notifications = React.lazy(() =>
  import('./pages/Notifications').then((module) => ({ default: module.Notifications })),
);
const Users = React.lazy(() => import('./pages/Users').then((module) => ({ default: module.Users })));

const PrivateRoute: React.FC<{ children: React.ReactElement; roles?: Role[] }> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  usePageMeta({
    path: location.pathname,
    robots: 'noindex, nofollow',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Spinner size="lg" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<PublicHome />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/use-cases" element={<UseCasesPage />} />
              <Route path="/technology" element={<TechnologyPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/sugarcane-monitoring" element={<SugarcaneMonitoringPage />} />
              <Route path="/precision-agriculture-dashboard" element={<PrecisionAgricultureDashboardPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/fields" element={<PrivateRoute><Fields /></PrivateRoute>} />
              <Route path="/fields/:id" element={<PrivateRoute><FieldDetail /></PrivateRoute>} />
              <Route path="/environmental" element={<PrivateRoute><Environmental /></PrivateRoute>} />
              <Route path="/iot" element={<PrivateRoute><IoTMonitoring /></PrivateRoute>} />
              <Route path="/satellite" element={<PrivateRoute><SatelliteMonitoring /></PrivateRoute>} />
              <Route path="/agronomy" element={<PrivateRoute><Agronomy /></PrivateRoute>} />
              <Route path="/ai" element={<PrivateRoute><AIRecommendations /></PrivateRoute>} />
              <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute roles={[Role.ADMIN, Role.MANAGER]}><Users /></PrivateRoute>} />
              <Route path="*" element={<PublicNotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
