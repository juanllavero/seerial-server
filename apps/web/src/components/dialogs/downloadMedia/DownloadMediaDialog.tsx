import { useTranslation } from 'react-i18next'
import { shallow } from 'zustand/shallow'
import { ModalWrapper } from '@/components/ModalWrapper'
import { useDialogStore } from '@/context/dialog.store'
import DownloadMediaSearch from './DownloadMediaSearch'

function DownloadMediaDialog() {
  const { downloadMediaDialog, closeDownloadMediaDialog } = useDialogStore(
    (state) => ({
      downloadMediaDialog: state.downloadMediaDialog,
      closeDownloadMediaDialog: state.closeDownloadMediaDialog,
    }),
    shallow,
  )
  const { t } = useTranslation()

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
      isOpen={downloadMediaDialog.isOpen}
      close={closeDownloadMediaDialog}
      hideButtons
    />
  )
}

export default DownloadMediaDialog
