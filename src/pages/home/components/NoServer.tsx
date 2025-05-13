import React from 'react'
import { useTranslation } from 'react-i18next'
import AlertContent from './AlertContent'

function NoServer() {
  const { t } = useTranslation()
  return (
    <AlertContent title={t('serverError')} message={t('serverErrorMessage')} />
  )
}

export default NoServer
