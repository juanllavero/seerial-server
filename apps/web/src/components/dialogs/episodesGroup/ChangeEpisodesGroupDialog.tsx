import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { ModalWrapper } from '@/components/ModalWrapper';
import { useDialogStore } from '@/context/dialog.store';
import ChangeEpisodesGroupSearch from './ChangeEpisodesGroupSearch';

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
