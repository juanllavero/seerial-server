import { Button } from '@/components/ui/button'
import { useDialogStore } from '@/context/dialog.context'
import { useTranslation } from 'react-i18next'
import AlertContent from './AlertContent'

function NoContent() {
  const { t } = useTranslation()
  const { openLibraryDialog } = useDialogStore()
  return (
    <AlertContent title={t('noLibraries')} message={t('addLibraryMessage')}>
      <Button onClick={() => openLibraryDialog()}>
        {t('libraryWindowTitle')}
      </Button>
    </AlertContent>
  )
}

export default NoContent
