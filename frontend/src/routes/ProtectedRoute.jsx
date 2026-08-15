import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/feedback/LoadingScreen';
import { paths } from './paths';

const ProtectedRoute = () => {
  const { isAuthenticated, bootstrapDone } = useAuth();
  const location = useLocation();

  if (!bootstrapDone) return <LoadingScreen message="Restoring your session" />;

  if (!isAuthenticated) {
    return <Navigate to={`${paths.login}?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
