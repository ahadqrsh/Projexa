import { useSelector } from 'react-redux';
import {
  selectUser,
  selectIsAuthenticated,
  selectBootstrapDone,
  selectCredits,
} from '@/features/auth/authSlice';

export const useAuth = () => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const bootstrapDone = useSelector(selectBootstrapDone);
  const credits = useSelector(selectCredits);

  return {
    user,
    isAuthenticated,
    bootstrapDone,
    credits,
    role: user?.role ?? null,
    isAdmin: user?.role === 'admin',
    isMentor: user?.role === 'mentor' || user?.role === 'admin',
  };
};

export default useAuth;
