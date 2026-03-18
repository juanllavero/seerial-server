import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { ModalWrapper } from '@/shared/ui/modal-wrapper';
import { useDialogStore } from '../../../stores/dialog-store';
import CorrectIdentificationSearch from './correct-identification-search';

function ChangeIdentificationDialog() {
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
      title={t('correctIdentification')}
      tabs={[
        {
          title: t('generalButton'),
          content: <CorrectIdentificationSearch />,
        },
      ]}
      isOpen={open === 'identification'}
      close={closeDialog}
      hideButtons
    />
  );
}

export default ChangeIdentificationDialog;
