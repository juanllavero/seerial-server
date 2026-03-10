import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { setAppLanguage } from '@/localization/helpers/language_helpers'
import langs from '@/localization/langs'

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
