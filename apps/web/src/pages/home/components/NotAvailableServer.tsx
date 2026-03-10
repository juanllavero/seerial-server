import { useTranslation } from 'react-i18next'
import AlertContent from './AlertContent'

function NotAvailableServer() {
  const { t } = useTranslation()
  return <AlertContent title={t('serverError')} message={t('serverErrorMessage')} />
}

export default NotAvailableServer
