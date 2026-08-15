import { Link } from 'react-router-dom';
import { MoreVertical, Copy, Trash2, Pencil, Calendar, Users } from 'lucide-react';
import TiltCard from '@/components/three/TiltCard';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Dropdown, { DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { cn } from '@/utils/cn';
import { timeAgo, titleCase, daysUntil } from '@/utils/format';
import { STATUS_STYLES, DOMAIN_GRADIENTS, DIFFICULTY_STYLES } from '@/utils/constants';
import { paths } from '@/routes/paths';

const TOTAL_MODULES = 16;

const ProjectCard = ({ project, onDelete, onDuplicate }) => {
  const moduleCount = project.generatedModules?.length ?? 0;
  const modulePercent = Math.round((moduleCount / TOTAL_MODULES) * 100);
  const remaining = daysUntil(project.deadline);

  return (
    <TiltCard maxTilt={6}>
      <article className="glow-border group relative h-full overflow-hidden rounded-xl border border-subtle bg-elevated/70 backdrop-blur-xl transition-shadow duration-300 hover:shadow-lifted">
        <div className="relative h-28 overflow-hidden">
          {project.coverImage?.url ? (
            <img
              src={project.coverImage.url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className={cn(
                'h-full w-full bg-gradient-to-br opacity-80',
                DOMAIN_GRADIENTS[project.domain] ?? DOMAIN_GRADIENTS.other
              )}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-elevated via-elevated/40 to-transparent" />

          <div className="absolute right-2 top-2">
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-label="Project actions"
                  className="rounded-lg bg-base/60 p-1.5 text-content-secondary backdrop-blur transition-colors hover:text-content-primary"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
            >
              <Link to={paths.editProject(project._id)}>
                <DropdownItem icon={<Pencil className="h-4 w-4" />}>Edit</DropdownItem>
              </Link>
              <DropdownItem
                icon={<Copy className="h-4 w-4" />}
                onClick={() => onDuplicate?.(project._id)}
              >
                Duplicate
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem icon={<Trash2 className="h-4 w-4" />} danger onClick={() => onDelete?.(project)}>
                Delete
              </DropdownItem>
            </Dropdown>
          </div>

          <Badge
            className={cn('absolute left-3 top-2 backdrop-blur', STATUS_STYLES[project.status])}
            dot
          >
            {titleCase(project.status)}
          </Badge>
        </div>

        <Link to={paths.project(project._id)} className="tilt-layer block p-4 pt-2">
          <h3 className="line-clamp-1 font-semibold text-content-primary transition-colors group-hover:text-primary-400">
            {project.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
            <span className="capitalize">{project.domain}</span>
            <span className={cn('capitalize', DIFFICULTY_STYLES[project.difficulty])}>
              {project.difficulty}
            </span>
            {project.teamSize > 1 && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {project.teamSize}
              </span>
            )}
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-content-secondary">
            {project.description}
          </p>

          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-content-muted">Modules</span>
              <span className="font-mono text-content-secondary">
                {moduleCount}/{TOTAL_MODULES}
              </span>
            </div>
            <ProgressBar value={modulePercent} size="sm" />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-subtle pt-3 text-xs text-content-muted">
            <span>{timeAgo(project.updatedAt)}</span>
            {remaining !== null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  remaining < 0 ? 'text-danger' : remaining <= 7 ? 'text-warning' : ''
                )}
              >
                <Calendar className="h-3 w-3" />
                {remaining < 0 ? `${Math.abs(remaining)}d overdue` : `${remaining}d left`}
              </span>
            )}
          </div>
        </Link>
      </article>
    </TiltCard>
  );
};

export default ProjectCard;
