import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import type * as React from 'react';

import { cn } from '../../utils/tailwind';
import { buttonVariants } from './button';

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

function AlertDialogOverlay(
  props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>,
) {
  const { className, ...rest } = props;
  return (
    <AlertDialogPrimitive.Overlay
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80',
        className,
      )}
      {...rest}
    />
  );
}

function AlertDialogContent(
  props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>,
) {
  const { className, ...rest } = props;
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]  data-[state=closed]:duration-350 data-[state=open]:duration-350 gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg',
          className,
        )}
        {...rest}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div className={cn('flex flex-col gap-2 text-center sm:text-left', className)} {...rest} />
  );
}

function AlertDialogFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2', className)}
      {...rest}
    />
  );
}

function AlertDialogTitle(
  props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>,
) {
  const { className, ...rest } = props;
  return (
    <AlertDialogPrimitive.Title className={cn('text-[2.5vh] font-semibold', className)} {...rest} />
  );
}

function AlertDialogDescription(
  props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>,
) {
  const { className, ...rest } = props;
  return (
    <AlertDialogPrimitive.Description
      className={cn('text-muted-foreground text-[1.5vh]', className)}
      {...rest}
    />
  );
}

function AlertDialogAction(
  props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>,
) {
  const { className, ...rest } = props;
  return <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...rest} />;
}

function AlertDialogCancel(
  props: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>,
) {
  const { className, ...rest } = props;
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', className)}
      {...rest}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
