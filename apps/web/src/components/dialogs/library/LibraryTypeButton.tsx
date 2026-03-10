import { Film, Music, TvMinimal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'

interface LibraryTypeButtonProps {
  selectedType: string | undefined
  type: string
  disabled?: boolean
  onClick: () => void
}

function LibraryTypeButton({ selectedType, type, disabled, onClick }: LibraryTypeButtonProps) {
  const { t } = useTranslation()
  return (
    <Button
      variant={'ghost'}
      className="h-fit w-40"
      onClick={onClick}
      disabled={disabled}
      style={{
        color: selectedType?.toLowerCase() === type ? 'var(--app-color)' : '',
      }}
    >
      <FlexBox direction="column" gap={1} justify="center" align="center" padding="1rem">
        {type === 'movies' ? (
          <Film size={'2rem'} />
        ) : type === 'shows' ? (
          <TvMinimal size={'2rem'} />
        ) : (
          <Music size={'2rem'} />
        )}
        <span
          className="font-semibold"
          style={{
            color: selectedType?.toLowerCase() === type ? 'var(--app-color)' : '',
          }}
        >
          {t(type)}
        </span>
      </FlexBox>
    </Button>
  )
}

export default LibraryTypeButton
