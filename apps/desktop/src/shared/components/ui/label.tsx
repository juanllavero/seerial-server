import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/tailwind';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

function Label(
  props: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>,
) {
  const { className, ...rest } = props;
  return <LabelPrimitive.Root className={cn(labelVariants(), className)} {...rest} />;
}

export { Label };
