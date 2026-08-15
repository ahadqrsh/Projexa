import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/form/FormInput';
import PasswordInput from './PasswordInput';
import { login, selectAuthStatus, clearAuthError } from '@/features/auth/authSlice';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
  useDocumentTitle('Sign in');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = useSelector(selectAuthStatus);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const onSubmit = async (values) => {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.name.split(' ')[0]}`);
      navigate(searchParams.get('from') || paths.dashboard, { replace: true });
    } else {
      toast.error(result.payload?.message ?? 'Could not sign you in');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-bold text-content-primary sm:text-3xl">Welcome back</h1>
      <p className="mt-2 text-sm text-content-secondary">
        Sign in to continue building your project.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <FormInput
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@college.edu"
          leftIcon={<Mail className="h-4 w-4" />}
          register={register}
          error={errors.email?.message}
        />

        <div>
          <PasswordInput
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            leftIcon={<Lock className="h-4 w-4" />}
            register={register}
            error={errors.password?.message}
          />
          <div className="mt-2 flex justify-end">
            <Link
              to={paths.forgotPassword}
              className="text-xs font-medium text-primary-400 transition-colors hover:text-primary-500"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full justify-center"
          loading={status === 'loading'}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-content-secondary">
        New here?{' '}
        <Link
          to={paths.register}
          className="font-semibold text-primary-400 transition-colors hover:text-primary-500"
        >
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-xl border border-subtle bg-surface/60 p-4">
        <p className="text-xs font-medium text-content-secondary">Demo account</p>
        <p className="mt-1.5 font-mono text-xs text-content-muted">
          student@apm.dev · Password@123
        </p>
      </div>
    </motion.div>
  );
};

export default LoginPage;
