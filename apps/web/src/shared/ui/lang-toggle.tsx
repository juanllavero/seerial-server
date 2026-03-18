import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '@/shared/localization/helpers/language-helpers';
import langs from '@/shared/localization/langs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

export default function LangToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  function onValueChange(value: string) {
    setAppLanguage(value, i18n);
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
  );
}
