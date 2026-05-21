import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '../../utils/tailwind';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success: 'border-success/50 text-success dark:border-success [&>svg]:text-success',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Alert(props: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  const { className, variant, ...rest } = props;
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...rest} />;
}

function AlertTitle(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div className={cn('mb-1 leading-none font-medium tracking-tight', className)} {...rest} />
  );
}

function AlertDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  const { className, ...rest } = props;
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...rest} />;
}

export { Alert, AlertDescription, AlertTitle };
