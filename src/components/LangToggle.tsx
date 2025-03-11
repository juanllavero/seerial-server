import React from 'react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import langs from '@/localization/langs'
import { useTranslation } from 'react-i18next'
import { setAppLanguage } from '@/helpers/language_helpers'

export default function LangToggle() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language

  function onValueChange(value: string) {
    setAppLanguage(value, i18n)
  }

  return (
    <Select value={currentLang} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {langs.map((lang) => (
          <SelectItem key={lang.key} value={lang.key}>
            {`${lang.prefix} ${lang.nativeName}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
