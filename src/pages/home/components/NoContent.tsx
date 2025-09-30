import { Button } from '@/components/ui/button'
import { useDialogStore } from '@/context/dialog.context'
import { useTranslation } from 'react-i18next'
import AlertContent from './AlertContent'
import { useIsAdmin } from '@/hooks/useIsAdmin'

function NoContent() {
  const { t } = useTranslation()
  const isAdmin = useIsAdmin()
  const openLibraryDialog = useDialogStore((state) => state.openLibraryDialog)
  return (
    <AlertContent
      title={t('noLibraries')}
      message={isAdmin ? t('addLibraryMessage') : ''}
    >
      {isAdmin && (
        <Button onClick={() => openLibraryDialog()}>
          {t('libraryWindowTitle')}
        </Button>
      )}
    </AlertContent>
  )
}

export default NoContent
