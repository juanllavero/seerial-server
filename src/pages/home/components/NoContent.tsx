import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import AlertContent from './AlertContent'

function NoContent() {
  const { t } = useTranslation()
  return (
    <AlertContent title={t('noLibraries')} message={t('addLibraryMessage')}>
      <Button>{t('addLibrary')}</Button>
    </AlertContent>
  )
}

export default NoContent
