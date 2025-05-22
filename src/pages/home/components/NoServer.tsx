import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import AlertContent from './AlertContent'

function NoServer() {
  const { t } = useTranslation()
  return (
    <AlertContent
      title={'No se han encontrado servidores'}
      message={
        'Descargue la aplicación Seerial Media Server e instálela en su servidor de contenido multimedia'
      }
    >
      <Button>{t('downloadButton')}</Button>
    </AlertContent>
  )
}

export default NoServer
