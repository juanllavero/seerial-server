import { useTranslation } from 'react-i18next';
import AppAlertDialog from '@/shared/components/app-alert-dialog';
import { useAppUpdater } from '../hooks/use-app-updater';

function UpdateDialog() {
  const { t } = useTranslation();
  const { update, installing, installUpdate, dismissUpdate } = useAppUpdater();

  if (!update) return null;

  return (
    <AppAlertDialog
      open={!!update}
      subtitle={t('updater.subtitle', 'New version available')}
      title={t('updater.title', 'Update {{version}}', { version: update.version })}
      description={
        update.body ? update.body : t('updater.description', 'A new version is ready to install.')
      }
      primaryAction={{
        label: installing
          ? t('updater.installing', 'Installing…')
          : t('updater.confirm', 'Update now'),
        onPress: installUpdate,
        disabled: installing,
      }}
      secondaryAction={{
        label: t('updater.dismiss', 'Later'),
        onPress: dismissUpdate,
        disabled: installing,
      }}
    />
  );
}

export default UpdateDialog;
