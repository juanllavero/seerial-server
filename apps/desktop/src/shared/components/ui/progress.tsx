import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../utils/tailwind';

function Progress(props: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>) {
  const { className, value, ...rest } = props;
  return (
    <ProgressPrimitive.Root
      className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
      {...rest}
    >
      <ProgressPrimitive.Indicator
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
