import { useTranslation } from 'react-i18next';
import AlertContent from './alert-content';

function NotAvailableServer() {
  const { t } = useTranslation();
  return <AlertContent title={t('serverError')} message={t('serverErrorMessage')} />;
}

export default NotAvailableServer;
