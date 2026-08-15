import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Moon, Sun, Monitor, Lock, LogOut, Smartphone, ShieldAlert } from 'lucide-react';
import PageTransition from '@/components/motion/PageTransition';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';
import Badge from '@/components/ui/Badge';
import PasswordInput from '@/pages/auth/PasswordInput';
import { authApi } from '@/features/auth/authApi';
import { logout } from '@/features/auth/authSlice';
import { selectTheme, setTheme } from '@/features/ui/uiSlice';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/utils/cn';
import { timeAgo } from '@/utils/format';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/\d/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const SettingsPage = () => {
  useDocumentTitle('Settings');
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const { user } = useAuth();

  const [emailNotifications, setEmailNotifications] = useState(
    user?.preferences?.emailNotifications ?? true
  );
  const [sessions, setSessions] = useState([]);
  const [changing, setChanging] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    authApi
      .sessions()
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]));
  }, []);

  const handlePasswordChange = async (values) => {
    setChanging(true);
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      toast.success('Password changed. Other sessions were signed out.');
    } catch (error) {
      toast.error(error?.errors?.[0]?.message ?? error?.message ?? 'Could not change your password');
    } finally {
      setChanging(false);
    }
  };

  const handleNotifications = async (next) => {
    setEmailNotifications(next);
    try {
      await authApi.updatePreferences({ emailNotifications: next });
    } catch {
      setEmailNotifications(!next);
      toast.error('Could not save that preference');
    }
  };

  return (
    <PageTransition className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-content-primary">Settings</h1>

      <section className="rounded-2xl border border-subtle bg-elevated/70 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-content-primary">Appearance</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Choose how the interface looks. Your choice is remembered on this device.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => dispatch(setTheme(value))}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200',
                theme === value
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400 shadow-glow'
                  : 'border-strong text-content-secondary hover:border-primary-500/50'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-subtle bg-elevated/70 p-6 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-content-primary">Notifications</h2>
        <div className="mt-4">
          <Switch
            checked={emailNotifications}
            onChange={handleNotifications}
            label="Email notifications"
            description="Verification, password resets and mentor activity"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-subtle bg-elevated/70 p-6 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-content-primary">
          <Lock className="h-4 w-4" />
          Change password
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          Changing your password signs out every other device.
        </p>

        <form onSubmit={handleSubmit(handlePasswordChange)} className="mt-5 space-y-4" noValidate>
          <PasswordInput
            label="Current password"
            name="currentPassword"
            autoComplete="current-password"
            register={register}
            error={errors.currentPassword?.message}
          />
          <PasswordInput
            label="New password"
            name="newPassword"
            autoComplete="new-password"
            register={register}
            error={errors.newPassword?.message}
          />
          <PasswordInput
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            register={register}
            error={errors.confirmPassword?.message}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={changing}>
              Update password
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-subtle bg-elevated/70 p-6 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-content-primary">
          <Smartphone className="h-4 w-4" />
          Active sessions
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          Devices with a valid session. Signing out everywhere revokes them all.
        </p>

        <ul className="mt-4 space-y-2">
          {sessions.length === 0 ? (
            <li className="rounded-lg border border-subtle bg-surface/60 p-3 text-sm text-content-muted">
              No other active sessions.
            </li>
          ) : (
            sessions.map((session) => (
              <li
                key={session._id}
                className="flex items-center justify-between gap-3 rounded-lg border border-subtle bg-surface/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-content-primary">
                    {session.userAgent?.slice(0, 60) || 'Unknown device'}
                  </p>
                  <p className="text-xs text-content-muted">
                    {session.ipAddress || 'unknown IP'} · {timeAgo(session.createdAt)}
                  </p>
                </div>
                <Badge variant="success" dot>
                  Active
                </Badge>
              </li>
            ))
          )}
        </ul>

        <Button
          variant="secondary"
          className="mt-4"
          leftIcon={<LogOut className="h-4 w-4" />}
          onClick={async () => {
            await authApi.logout();
            await dispatch(logout());
            toast.success('Signed out everywhere');
          }}
        >
          Sign out everywhere
        </Button>
      </section>

      <section className="rounded-2xl border border-danger/25 bg-danger/5 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-danger">
          <ShieldAlert className="h-4 w-4" />
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-content-secondary">
          Deleting your account removes every project and generated document permanently.
        </p>
        <Button variant="danger" className="mt-4" disabled title="Available in Phase 6">
          Delete account
        </Button>
      </section>
    </PageTransition>
  );
};

export default SettingsPage;
