import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import NavigationButton from './navigation/navigation-button';
import NavigationContainer from './navigation/navigation-container';

const PRIMARY_ACTION_FOCUS_KEY = 'app-alert-dialog-primary-action';

type DialogAction = {
  label: string;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
};

interface AppAlertDialogProps {
  open: boolean;
  title?: string;
  subtitle?: string;
  description?: string;
  primaryAction: DialogAction;
  secondaryAction?: DialogAction;
}

function AppAlertDialog({
  open,
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
}: AppAlertDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFocus(PRIMARY_ACTION_FOCUS_KEY);
    }, 30);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [open]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <NavigationContainer
          className="grid gap-6"
          isFocusBoundary={open}
          focusBoundaryDirections={['up', 'down', 'left', 'right']}
        >
          <AlertDialogHeader>
            {!!subtitle && (
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-white/50">
                {subtitle}
              </div>
            )}
            {!!title && <AlertDialogTitle>{title}</AlertDialogTitle>}
            {!!description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {!!secondaryAction && (
              <NavigationButton
                text={secondaryAction.label}
                onClick={() => void secondaryAction.onPress?.()}
                disabled={secondaryAction.disabled}
                className="mt-0 min-w-36 justify-center rounded-xl border border-white/15 px-5 py-3 text-base"
              />
            )}
            <NavigationButton
              text={primaryAction.label}
              onClick={() => void primaryAction.onPress?.()}
              disabled={primaryAction.disabled}
              customKey={PRIMARY_ACTION_FOCUS_KEY}
              className="min-w-36 justify-center rounded-xl px-5 py-3 text-base"
            />
          </AlertDialogFooter>
        </NavigationContainer>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type { AppAlertDialogProps, DialogAction };
export default AppAlertDialog;
