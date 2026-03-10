import { useTranslation } from 'react-i18next'
import { shallow } from 'zustand/shallow'
import { ModalWrapper } from '@/components/ModalWrapper'
import { useDialogStore } from '@/context/dialog.store'
import CorrectIdentificationSearch from './CorrectIdentificationSearch'

function ChangeIdentificationDialog() {
  const { identificationDialog, closeIdentificationDialog } = useDialogStore(
    (state) => ({
      identificationDialog: state.identificationDialog,
      closeIdentificationDialog: state.closeIdentificationDialog,
    }),
    shallow,
  )
  const { t } = useTranslation()

  return (
    <ModalWrapper
      title={t('correctIdentification')}
      tabs={[
        {
          title: t('generalButton'),
          content: <CorrectIdentificationSearch />,
        },
      ]}
      isOpen={identificationDialog.isOpen}
      close={closeIdentificationDialog}
      hideButtons
    />
  )
}

export default ChangeIdentificationDialog
