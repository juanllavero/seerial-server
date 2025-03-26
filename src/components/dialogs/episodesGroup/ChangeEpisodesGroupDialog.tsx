import { ModalWrapper } from '@/components/ModalWrapper'
import { useDialogStore } from '@/context/dialog.context'
import React from 'react'
import { useTranslation } from 'react-i18next'
import ChangeEpisodesGroupSearch from './ChangeEpisodesGroupSearch'

function ChangeEpisodesGroupDialog() {
  const { episodesGroupDialog, closeEpisodesGroupDialog } = useDialogStore()
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
