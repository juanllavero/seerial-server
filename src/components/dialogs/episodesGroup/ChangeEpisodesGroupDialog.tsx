import { ModalWrapper } from '@/components/ModalWrapper'
import { useDialogStore } from '@/context/dialog.context'
import { useTranslation } from 'react-i18next'
import ChangeEpisodesGroupSearch from './ChangeEpisodesGroupSearch'
import { shallow } from 'zustand/shallow'

function ChangeEpisodesGroupDialog() {
  const { episodesGroupDialog, closeEpisodesGroupDialog } = useDialogStore(
    (state) => ({
      episodesGroupDialog: state.episodesGroupDialog,
      closeEpisodesGroupDialog: state.closeEpisodesGroupDialog,
    }),
    shallow,
  )
  const { t } = useTranslation()

  return (
    <ModalWrapper
      title={t('changeEpisodesGroup')}
      tabs={[
        {
          title: t('generalButton'),
          content: <ChangeEpisodesGroupSearch />,
        },
      ]}
      isOpen={episodesGroupDialog.isOpen}
      close={closeEpisodesGroupDialog}
      hideButtons
    />
  )
}

export default ChangeEpisodesGroupDialog
