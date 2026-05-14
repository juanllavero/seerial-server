import type React from 'react';
import { cn } from '@/shared/lib/tailwind';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('bg-primary/10 animate-pulse rounded-md', className)} {...props} />;
}

export { Skeleton };
