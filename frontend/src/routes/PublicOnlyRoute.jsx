import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/feedback/LoadingScreen';
import { paths } from './paths';

const PublicOnlyRoute = () => {
  const { isAuthenticated, bootstrapDone } = useAuth();

  if (!bootstrapDone) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to={paths.dashboard} replace />;

  return <Outlet />;
};

export default PublicOnlyRoute;
