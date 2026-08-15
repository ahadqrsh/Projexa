import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { paths } from './paths';

const RoleRoute = ({ allow = [] }) => {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to={paths.login} replace />;
  if (!allow.includes(role)) return <Navigate to={paths.forbidden} replace />;

  return <Outlet />;
};

export default RoleRoute;
