import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import RootLayout from '@/layouts/RootLayout';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import LoadingScreen from '@/components/feedback/LoadingScreen';
import { paths } from './paths';

const LandingPage = lazy(() => import('@/pages/marketing/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ProjectsPage = lazy(() => import('@/pages/dashboard/ProjectsPage'));
const NewProjectPage = lazy(() => import('@/pages/dashboard/NewProjectPage'));
const ProjectDetailPage = lazy(() => import('@/pages/dashboard/ProjectDetailPage'));
const ArtifactViewerPage = lazy(() => import('@/pages/dashboard/ArtifactViewerPage'));
const EditProjectPage = lazy(() => import('@/pages/dashboard/EditProjectPage'));
const ProfilePage = lazy(() => import('@/pages/dashboard/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'));
const ForbiddenPage = lazy(() => import('@/pages/errors/ForbiddenPage'));

const withSuspense = (element) => <Suspense fallback={<LoadingScreen />}>{element}</Suspense>;

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: paths.landing, element: withSuspense(<LandingPage />) },

      {
        element: <PublicOnlyRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: paths.login, element: withSuspense(<LoginPage />) },
              { path: paths.register, element: withSuspense(<RegisterPage />) },
              { path: paths.forgotPassword, element: withSuspense(<ForgotPasswordPage />) },
              { path: paths.resetPassword(), element: withSuspense(<ResetPasswordPage />) },
            ],
          },
        ],
      },

      {
        element: <AuthLayout />,
        children: [{ path: paths.verifyEmail(), element: withSuspense(<VerifyEmailPage />) }],
      },

      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: paths.dashboard, element: withSuspense(<DashboardPage />) },
              { path: paths.projects, element: withSuspense(<ProjectsPage />) },
              { path: paths.newProject, element: withSuspense(<NewProjectPage />) },
              { path: paths.project(), element: withSuspense(<ProjectDetailPage />) },
              { path: paths.artifact(), element: withSuspense(<ArtifactViewerPage />) },
              { path: paths.editProject(), element: withSuspense(<EditProjectPage />) },
              { path: paths.profile, element: withSuspense(<ProfilePage />) },
              { path: paths.settings, element: withSuspense(<SettingsPage />) },
            ],
          },
        ],
      },

      { path: paths.forbidden, element: withSuspense(<ForbiddenPage />) },
      { path: paths.notFound, element: withSuspense(<NotFoundPage />) },
    ],
  },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
