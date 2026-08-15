import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, MailCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/form/FormInput';
import { authApi } from '@/features/auth/authApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

const ForgotPasswordPage = () => {
  useDocumentTitle('Reset password');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (error) {
      toast.error(error?.message ?? 'Could not send the reset link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-success/30 bg-success/10 text-success">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-content-primary">Check your inbox</h1>
        <p className="mt-2 text-sm text-content-secondary">
          If an account exists for{' '}
          <span className="font-medium text-content-primary">{getValues('email')}</span>, a reset
          link is on its way. It expires in 30 minutes.
        </p>
        <p className="mt-4 text-xs text-content-muted">
          No SMTP configured in development? The link is printed in your backend terminal.
        </p>
        <Link to={paths.login}>
          <Button variant="ghost" className="mt-6" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to sign in
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-content-primary sm:text-3xl">Forgot your password?</h1>
      <p className="mt-2 text-sm text-content-secondary">
        Enter your email and we will send you a reset link.
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
        <Button type="submit" size="lg" className="w-full justify-center" loading={loading}>
          Send reset link
        </Button>
      </form>

      <Link to={paths.login}>
        <Button variant="ghost" className="mt-6 w-full justify-center" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to sign in
        </Button>
      </Link>
    </motion.div>
  );
};

export default ForgotPasswordPage;
