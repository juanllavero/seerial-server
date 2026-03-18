import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { ModalWrapper } from '@/shared/ui/modal-wrapper';
import { useDialogStore } from '../../../stores/dialog-store';
import ChangeEpisodesGroupSearch from './change-episodes-group-search';

function ChangeEpisodesGroupDialog() {
  const { open, closeDialog } = useDialogStore(
    (state) => ({
      open: state.open,
      closeDialog: state.closeDialog,
    }),
    shallow,
  );
  const { t } = useTranslation();

  return (
    <ModalWrapper
      title={t('changeEpisodesGroup')}
      tabs={[
        {
          title: t('generalButton'),
          content: <ChangeEpisodesGroupSearch />,
        },
      ]}
      isOpen={open === 'episodesGroup'}
      close={closeDialog}
      hideButtons
    />
  );
}

export default ChangeEpisodesGroupDialog;
