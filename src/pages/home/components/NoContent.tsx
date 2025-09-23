import { Button } from '@/components/ui/button'
import { useDialogStore } from '@/context/dialog.context'
import { useTranslation } from 'react-i18next'
import AlertContent from './AlertContent'
import { useIsServerOwner } from '@/hooks/useServerOwner'

function NoContent() {
  const { t } = useTranslation()
  const isServerOwner = useIsServerOwner()
  const openLibraryDialog = useDialogStore((state) => state.openLibraryDialog)
  return (
    <AlertContent
      title={t('noLibraries')}
      message={isServerOwner ? t('addLibraryMessage') : ''}
    >
      {isServerOwner && (
        <Button onClick={() => openLibraryDialog()}>
          {t('libraryWindowTitle')}
        </Button>
      )}
    </AlertContent>
  )
}

export default NoContent
