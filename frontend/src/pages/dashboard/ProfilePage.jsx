import { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Camera, Trash2, Save, Github, Linkedin, GraduationCap, Zap } from 'lucide-react';
import PageTransition from '@/components/motion/PageTransition';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import FormInput from '@/components/form/FormInput';
import FormTextarea from '@/components/form/FormTextarea';
import FormTagInput from '@/components/form/FormTagInput';
import { authApi } from '@/features/auth/authApi';
import { updateProfile, setUser } from '@/features/auth/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate } from '@/utils/format';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().or(z.literal('')),
  college: z.string().max(120).optional().or(z.literal('')),
  branch: z.string().max(80).optional().or(z.literal('')),
  graduationYear: z.coerce.number().int().min(2000).max(2100).optional().or(z.literal('')),
  skills: z.array(z.string()).max(20).optional(),
  github: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

const MAX_AVATAR_MB = 2;

const ProfilePage = () => {
  useDocumentTitle('Profile');
  const dispatch = useDispatch();
  const { user, credits } = useAuth();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      bio: user?.bio ?? '',
      college: user?.college ?? '',
      branch: user?.branch ?? '',
      graduationYear: user?.graduationYear ?? '',
      skills: user?.skills ?? [],
      github: user?.github ?? '',
      linkedin: user?.linkedin ?? '',
    },
  });

  const onSubmit = async (values) => {
    setSaving(true);
    const payload = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined)
    );
    const result = await dispatch(updateProfile(payload));
    setSaving(false);

    if (updateProfile.fulfilled.match(result)) toast.success('Profile updated');
    else toast.error(result.payload?.message ?? 'Could not save your profile');
  };

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_AVATAR_MB} MB`);
      return;
    }

    setUploading(true);
    try {
      const { user: updated } = await authApi.uploadAvatar(file);
      dispatch(setUser(updated));
      toast.success('Avatar updated');
    } catch (error) {
      toast.error(error?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const { user: updated } = await authApi.removeAvatar();
      dispatch(setUser(updated));
      toast.success('Avatar removed');
    } catch (error) {
      toast.error(error?.message ?? 'Could not remove the avatar');
    }
  };

  const creditPercent = credits.limit ? ((credits.limit - credits.used) / credits.limit) * 100 : 0;

  return (
    <PageTransition className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-content-primary">Profile</h1>

      <section className="glow-border rounded-2xl border border-subtle bg-elevated/70 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative">
            <Avatar src={user?.avatar?.url} name={user?.name} size="xl" ring />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change avatar"
              className="absolute -bottom-1 -right-1 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 p-2 text-white shadow-glow transition-transform hover:scale-105 disabled:opacity-60"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatar}
              className="hidden"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-content-primary">{user?.name}</h2>
            <p className="text-sm text-content-secondary">{user?.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="primary">{user?.role}</Badge>
              {user?.isEmailVerified ? (
                <Badge variant="success" dot>
                  Verified
                </Badge>
              ) : (
                <Badge variant="warning" dot>
                  Unverified
                </Badge>
              )}
              {user?.createdAt && (
                <span className="text-xs text-content-muted">
                  Joined {formatDate(user.createdAt)}
                </span>
              )}
            </div>
          </div>

          {user?.avatar?.url && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveAvatar}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              className="text-danger hover:bg-danger/10"
            >
              Remove photo
            </Button>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-subtle bg-surface/60 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-content-secondary">
              <Zap className="h-4 w-4 text-accent-400" />
              AI credits remaining
            </span>
            <span className="font-mono text-content-primary">
              {credits.limit - credits.used} / {credits.limit}
            </span>
          </div>
          <ProgressBar value={creditPercent} className="mt-3" />
          {credits.resetAt && (
            <p className="mt-2 text-xs text-content-muted">
              Resets on {formatDate(credits.resetAt)}
            </p>
          )}
        </div>
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-2xl border border-subtle bg-elevated/70 p-6 backdrop-blur-xl"
        noValidate
      >
        <h2 className="text-lg font-semibold text-content-primary">Your details</h2>

        <FormInput
          label="Full name"
          name="name"
          required
          register={register}
          error={errors.name?.message}
        />

        <FormTextarea
          label="Bio"
          name="bio"
          rows={3}
          placeholder="A short line about you — shown on public projects."
          register={register}
          error={errors.bio?.message}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput
            label="College"
            name="college"
            placeholder="XYZ Institute of Technology"
            register={register}
            error={errors.college?.message}
          />
          <FormInput
            label="Branch"
            name="branch"
            placeholder="Computer Science"
            register={register}
            error={errors.branch?.message}
          />
        </div>

        <FormInput
          label="Graduation year"
          name="graduationYear"
          type="number"
          placeholder="2027"
          leftIcon={<GraduationCap className="h-4 w-4" />}
          register={register}
          error={errors.graduationYear?.message}
        />

        <Controller
          name="skills"
          control={control}
          render={({ field }) => (
            <FormTagInput
              label="Skills"
              name="skills"
              value={field.value ?? []}
              onChange={field.onChange}
              max={20}
              placeholder="React, Node.js, MongoDB…"
              hint="Used to tailor technology recommendations"
            />
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput
            label="GitHub"
            name="github"
            placeholder="https://github.com/username"
            leftIcon={<Github className="h-4 w-4" />}
            register={register}
            error={errors.github?.message}
          />
          <FormInput
            label="LinkedIn"
            name="linkedin"
            placeholder="https://linkedin.com/in/username"
            leftIcon={<Linkedin className="h-4 w-4" />}
            register={register}
            error={errors.linkedin?.message}
          />
        </div>

        <div className="flex justify-end border-t border-subtle pt-5">
          <Button
            type="submit"
            loading={saving}
            disabled={!isDirty}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save changes
          </Button>
        </div>
      </form>
    </PageTransition>
  );
};

export default ProfilePage;
