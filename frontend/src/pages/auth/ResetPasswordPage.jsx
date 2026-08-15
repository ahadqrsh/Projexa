import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import PasswordInput from './PasswordInput';
import { authApi } from '@/features/auth/authApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/\d/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const ResetPasswordPage = () => {
  useDocumentTitle('Set a new password');
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }) => {
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password updated. Please sign in.');
      navigate(paths.login, { replace: true });
    } catch (error) {
      toast.error(error?.message ?? 'This reset link is invalid or has expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-500/30 bg-primary-500/10 text-primary-400">
        <ShieldCheck className="h-5 w-5" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-content-primary sm:text-3xl">Set a new password</h1>
      <p className="mt-2 text-sm text-content-secondary">
        Choose something you have not used before. All other sessions will be signed out.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <PasswordInput
          label="New password"
          name="password"
          autoComplete="new-password"
          leftIcon={<Lock className="h-4 w-4" />}
          register={register}
          error={errors.password?.message}
        />
        <PasswordInput
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          leftIcon={<Lock className="h-4 w-4" />}
          register={register}
          error={errors.confirmPassword?.message}
        />
        <Button type="submit" size="lg" className="w-full justify-center" loading={loading}>
          Update password
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-content-secondary">
        Remembered it?{' '}
        <Link to={paths.login} className="font-semibold text-primary-400 hover:text-primary-500">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
};

export default ResetPasswordPage;
