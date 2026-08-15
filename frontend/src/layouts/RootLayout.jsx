import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { bootstrapSession, sessionExpired } from '@/features/auth/authSlice';
import { selectTheme } from '@/features/ui/uiSlice';
import { setSessionExpiredHandler } from '@/services/interceptors';
import ErrorBoundary from '@/components/feedback/ErrorBoundary';

const RootLayout = () => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    setSessionExpiredHandler(() => dispatch(sessionExpired()));
    dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <Outlet />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: '!bg-elevated !text-content-primary !border !border-strong !shadow-lifted',
          success: { iconTheme: { primary: 'rgb(var(--success))', secondary: '#fff' } },
          error: { iconTheme: { primary: 'rgb(var(--danger))', secondary: '#fff' } },
        }}
      />
    </ErrorBoundary>
  );
};

export default RootLayout;
