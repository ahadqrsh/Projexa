import { cn } from '@/utils/cn';

const Skeleton = ({ className }) => <div className={cn('skeleton h-4 w-full', className)} />;

export const SkeletonCard = () => (
  <div className="space-y-4 rounded-xl border border-subtle bg-elevated/60 p-5">
    <Skeleton className="h-32 w-full rounded-lg" />
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <Skeleton className="h-2 w-full rounded-full" />
  </div>
);

export const SkeletonStat = () => (
  <div className="space-y-3 rounded-xl border border-subtle bg-elevated/60 p-5">
    <Skeleton className="h-3 w-20" />
    <Skeleton className="h-8 w-16" />
  </div>
);

export default Skeleton;
