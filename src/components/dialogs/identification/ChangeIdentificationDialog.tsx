import { ModalWrapper } from '@/components/ModalWrapper'
import { useDialogStore } from '@/context/dialog.context'
import React from 'react'
import { useTranslation } from 'react-i18next'
import CorrectIdentificationSearch from './CorrectIdentificationSearch'

function ChangeIdentificationDialog() {
  const { identificationDialog, closeIdentificationDialog } = useDialogStore()
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
