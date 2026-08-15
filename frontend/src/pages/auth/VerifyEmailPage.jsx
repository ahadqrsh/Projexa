import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { authApi } from '@/features/auth/authApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';

const VerifyEmailPage = () => {
  useDocumentTitle('Verify email');
  const { token } = useParams();
  const [state, setState] = useState({ status: 'verifying', message: '' });

  useEffect(() => {
    let cancelled = false;

    authApi
      .verifyEmail(token)
      .then(() => {
        if (!cancelled) setState({ status: 'success', message: 'Your email is verified.' });
      })
      .catch((error) => {
        if (!cancelled)
          setState({
            status: 'error',
            message: error?.message ?? 'This link is invalid or has expired.',
          });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const content = {
    verifying: {
      icon: <Spinner size="lg" />,
      title: 'Verifying your email',
      tone: 'text-content-secondary',
    },
    success: {
      icon: <CheckCircle2 className="h-8 w-8" />,
      title: 'Email verified',
      tone: 'text-success',
    },
    error: {
      icon: <XCircle className="h-8 w-8" />,
      title: 'Verification failed',
      tone: 'text-danger',
    },
  }[state.status];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-subtle bg-surface ${content.tone}`}>
        {content.icon}
      </div>
      <h1 className="mt-5 text-2xl font-bold text-content-primary">{content.title}</h1>
      {state.message && <p className="mt-2 text-sm text-content-secondary">{state.message}</p>}

      {state.status !== 'verifying' && (
        <Link to={state.status === 'success' ? paths.dashboard : paths.login}>
          <Button className="mt-6">
            {state.status === 'success' ? 'Go to dashboard' : 'Back to sign in'}
          </Button>
        </Link>
      )}
    </motion.div>
  );
};

export default VerifyEmailPage;
