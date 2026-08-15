import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/form/FormInput';
import PasswordInput from './PasswordInput';
import { register as registerUser, selectAuthStatus } from '@/features/auth/authSlice';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { paths } from '@/routes/paths';
import { cn } from '@/utils/cn';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .max(128)
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/\d/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const rules = [
  { label: '8+ characters', test: (v) => v.length >= 8 },
  { label: 'Lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'Uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'Number', test: (v) => /\d/.test(v) },
];

const RegisterPage = () => {
  useDocumentTitle('Create account');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const status = useSelector(selectAuthStatus);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password') ?? '';

  const onSubmit = async ({ confirmPassword: _ignored, ...values }) => {
    const result = await dispatch(registerUser(values));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created. Check your email to verify it.');
      navigate(paths.dashboard, { replace: true });
    } else {
      toast.error(result.payload?.message ?? 'Could not create your account');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-bold text-content-primary sm:text-3xl">Create your account</h1>
      <p className="mt-2 text-sm text-content-secondary">
        Start turning ideas into complete project plans.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <FormInput
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Ahad Qureshi"
          leftIcon={<User className="h-4 w-4" />}
          register={register}
          error={errors.name?.message}
        />

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
            autoComplete="new-password"
            placeholder="Create a strong password"
            leftIcon={<Lock className="h-4 w-4" />}
            register={register}
            error={errors.password?.message}
          />
          {password && (
            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
              {rules.map((rule) => {
                const met = rule.test(password);
                return (
                  <span
                    key={rule.label}
                    className={cn(
                      'flex items-center gap-1.5 text-xs transition-colors',
                      met ? 'text-success' : 'text-content-muted'
                    )}
                  >
                    <Check className={cn('h-3 w-3', !met && 'opacity-30')} />
                    {rule.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          leftIcon={<Lock className="h-4 w-4" />}
          register={register}
          error={errors.confirmPassword?.message}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full justify-center"
          loading={status === 'loading'}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-content-secondary">
        Already have an account?{' '}
        <Link
          to={paths.login}
          className="font-semibold text-primary-400 transition-colors hover:text-primary-500"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
};

export default RegisterPage;
