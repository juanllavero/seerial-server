import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../utils/tailwind';

function Slider(props: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>) {
  const { className, ...rest } = props;
  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...rest}
    >
      <SliderPrimitive.Track className="bg-primary/20 relative h-1.5 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="border-primary/50 bg-background focus-visible:ring-ring block size-4 rounded-full border shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
}

export { Slider };
