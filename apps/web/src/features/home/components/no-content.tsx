import { useIsAdmin } from '@seerial/hooks';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/vanilla/shallow';
import { useDialogStore } from '@/features/management';
import { Button } from '@/shared/ui/button';
import AlertContent from './alert-content';

function NoContent() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const { openDialog } = useDialogStore((state) => ({ openDialog: state.openDialog }), shallow);

  const openLibraryDialog = () => {
    openDialog('library', {});
  };

  return (
    <AlertContent title={t('noLibraries')} message={isAdmin ? t('addLibraryMessage') : ''}>
      {isAdmin && <Button onClick={() => openLibraryDialog()}>{t('libraryWindowTitle')}</Button>}
    </AlertContent>
  );
}

export default NoContent;
