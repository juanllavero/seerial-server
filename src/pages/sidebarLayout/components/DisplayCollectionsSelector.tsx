import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { DisplayCollections } from '@/types/types'

const DisplayCollectionsSelector: React.FC = () => {
  const { t } = useTranslation()
  const [displayCollections, setDisplayCollections] =
    useLocalStorage<DisplayCollections>(
      'displayCollections',
      'collectionsAndElements',
    )

  // Define options with translation keys
  const options: { value: DisplayCollections; label: string }[] = [
    { value: 'collectionsAndElements', label: t('collectionsAndElements') },
    { value: 'onlyCollections', label: t('onlyCollections') },
    { value: 'onlyElements', label: t('onlyElements') },
  ]

  return (
    <Select
      value={displayCollections}
      onValueChange={(value: DisplayCollections) =>
        setDisplayCollections(value)
      }
    >
      <SelectTrigger className="w-fit">
        <SelectValue placeholder={t('selectOption')} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default DisplayCollectionsSelector
