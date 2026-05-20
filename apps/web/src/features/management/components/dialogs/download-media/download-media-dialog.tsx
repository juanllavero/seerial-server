import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { ModalWrapper } from '@/shared/ui/modal-wrapper';
import { useDialogStore } from '../../../stores/dialog-store';
import DownloadMediaSearch from './download-media-search';

function DownloadMediaDialog() {
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
      title={t('downloadButton')}
      tabs={[
        {
          title: t('generalButton'),
          content: <DownloadMediaSearch />,
        },
      ]}
      width={'35rem'}
      isOpen={open === 'downloadMedia'}
      close={closeDialog}
      hideButtons
    />
  );
}

export default DownloadMediaDialog;
