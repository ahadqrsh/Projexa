import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles, Rocket } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Switch from '@/components/ui/Switch';
import FormInput from '@/components/form/FormInput';
import FormTextarea from '@/components/form/FormTextarea';
import FormSelect from '@/components/form/FormSelect';
import FormTagInput from '@/components/form/FormTagInput';
import { cn } from '@/utils/cn';
import { titleCase } from '@/utils/format';
import { DOMAINS, DIFFICULTIES, PROJECT_TYPES } from '@/utils/constants';
import { projectSchema, stepFields, defaultProjectValues } from './projectSchema';

const steps = [
  { title: 'The idea', hint: 'What are you building?' },
  { title: 'Context', hint: 'Where does it fit?' },
  { title: 'Constraints', hint: 'Team, stack and timeline' },
  { title: 'Review', hint: 'Confirm and create' },
];

const IdeaWizard = ({ onSubmit, submitting, defaultValues, mode = 'create' }) => {
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { ...defaultProjectValues, ...defaultValues },
    mode: 'onTouched',
  });

  const values = watch();
  const isLastStep = step === steps.length - 1;

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <ol className="mb-8 flex items-center gap-2">
        {steps.map((entry, index) => {
          const complete = index < step;
          const active = index === step;
          return (
            <li key={entry.title} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all',
                  complete && 'bg-gradient-to-r from-primary-600 to-accent-600 text-white',
                  active && 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-glow',
                  !complete && !active && 'border border-strong text-content-muted'
                )}
              >
                {complete ? <Check className="h-4 w-4" /> : index + 1}
              </button>
              <div className="hidden min-w-0 sm:block">
                <p className={cn('truncate text-xs font-medium', active ? 'text-content-primary' : 'text-content-muted')}>
                  {entry.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={cn('h-px flex-1 transition-colors', complete ? 'bg-primary-500' : 'bg-subtle')} />
              )}
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold text-content-primary">{steps[step].title}</h2>
            <p className="text-sm text-content-secondary">{steps[step].hint}</p>
          </div>

          {step === 0 && (
            <>
              <FormInput
                label="Project title"
                name="title"
                required
                placeholder="AI-Powered Hospital Management System"
                register={register}
                error={errors.title?.message}
              />
              <FormTextarea
                label="Describe your idea"
                name="description"
                required
                rows={7}
                placeholder="A MERN platform where patients book appointments, doctors manage prescriptions and medical history, and admins view analytics. AI suggests optimal appointment slots and flags high-risk patients."
                register={register}
                error={errors.description?.message}
                hint={`${values.description?.length ?? 0}/2000 — the more specific you are, the better every generated module will be`}
              />
            </>
          )}

          {step === 1 && (
            <>
              <FormSelect
                label="Domain"
                name="domain"
                required
                placeholder="Select a domain"
                options={DOMAINS}
                register={register}
                error={errors.domain?.message}
              />
              <FormSelect
                label="Difficulty"
                name="difficulty"
                required
                placeholder="Select difficulty"
                options={DIFFICULTIES}
                register={register}
                error={errors.difficulty?.message}
                hint="Sets the depth of every recommendation — an expert plan is not useful for a beginner project"
              />
              <FormSelect
                label="Project type"
                name="projectType"
                options={PROJECT_TYPES}
                register={register}
                error={errors.projectType?.message}
              />
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormInput
                  label="Team size"
                  name="teamSize"
                  type="number"
                  min={1}
                  max={20}
                  register={register}
                  error={errors.teamSize?.message}
                  hint="Drives sprint and cost planning"
                />
                <FormInput
                  label="Deadline"
                  name="deadline"
                  type="date"
                  register={register}
                  error={errors.deadline?.message}
                  hint="Used to schedule the weekly roadmap"
                />
              </div>

              <Controller
                name="preferredTech"
                control={control}
                render={({ field }) => (
                  <FormTagInput
                    label="Preferred technologies"
                    name="preferredTech"
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="React, Node.js, MongoDB…"
                    hint="Leave empty and the AI will recommend a stack for you"
                  />
                )}
              />

              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <FormTagInput
                    label="Tags"
                    name="tags"
                    value={field.value ?? []}
                    onChange={field.onChange}
                    max={15}
                    placeholder="mern, healthcare…"
                  />
                )}
              />

              <Controller
                name="aiIntegrationRequired"
                control={control}
                render={({ field }) => (
                  <div className="rounded-xl border border-subtle bg-surface/60 p-4">
                    <Switch
                      checked={Boolean(field.value)}
                      onChange={field.onChange}
                      label="This project needs AI integration"
                      description="Adds model selection and AI-specific requirements to the generated plan"
                    />
                  </div>
                )}
              />
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="glow-border rounded-xl border border-subtle bg-surface/60 p-5">
                <h3 className="font-semibold text-content-primary">{values.title || 'Untitled project'}</h3>
                <p className="mt-2 line-clamp-4 text-sm text-content-secondary">
                  {values.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {values.domain && <Badge variant="primary">{titleCase(values.domain)}</Badge>}
                  {values.difficulty && <Badge variant="accent">{titleCase(values.difficulty)}</Badge>}
                  <Badge>{values.teamSize} {values.teamSize > 1 ? 'members' : 'member'}</Badge>
                  {values.projectType && <Badge>{titleCase(values.projectType)}</Badge>}
                  {values.aiIntegrationRequired && (
                    <Badge variant="info" dot>
                      AI integration
                    </Badge>
                  )}
                </div>

                {values.preferredTech?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-content-muted">Preferred stack</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {values.preferredTech.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md border border-strong bg-elevated px-2 py-0.5 font-mono text-xs text-content-secondary"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-primary-500/25 bg-primary-500/10 p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
                <p className="text-xs leading-relaxed text-content-secondary">
                  Once created, you can generate the full SDLC plan — overview, SRS, database
                  design, API contracts, roadmap and viva questions.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-subtle pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>

        {isLastStep ? (
          <Button
            type="submit"
            size="lg"
            loading={submitting}
            leftIcon={<Rocket className="h-4 w-4" />}
          >
            {mode === 'edit' ? 'Save changes' : 'Create project'}
          </Button>
        ) : (
          <Button type="button" onClick={goNext} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Continue
          </Button>
        )}
      </div>
    </form>
  );
};

export default IdeaWizard;
