import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import TagInput from '@/components/ui/tags-input'
import { useTranslation } from 'react-i18next'

interface SeriesTagsTabProps {
  genres: string[]
  setGenres: (genres: string[]) => void
  creator: string[]
  setCreator: (creator: string[]) => void
  studios: string[]
  setStudios: (studios: string[]) => void
  music: string[]
  setMusic: (music: string[]) => void
}

function SeriesTagsTab({
  genres,
  setGenres,
  creator,
  setCreator,
  studios,
  setStudios,
  music,
  setMusic,
}: SeriesTagsTabProps) {
  const { t } = useTranslation()
  const isTablet = useIsTablet()
  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="start"
      align="center"
      height={isTablet ? '25rem' : '35rem'}
      hideScrollbar={isTablet}
      scroll="vertical"
    >
      <LabeledInputWrapper label={t('genres')}>
        <TagInput
          value={genres}
          onChange={setGenres}
          placeholder="Añadir género..."
        />
      </LabeledInputWrapper>
      <LabeledInputWrapper label={t('createdBy')}>
        <TagInput
          value={creator}
          onChange={setCreator}
          placeholder="Añadir creador..."
        />
      </LabeledInputWrapper>
      <LabeledInputWrapper label={t('studios')}>
        <TagInput
          value={studios}
          onChange={setStudios}
          placeholder="Añadir estudio..."
        />
      </LabeledInputWrapper>
      <LabeledInputWrapper label={t('musicBy')}>
        <TagInput
          value={music}
          onChange={setMusic}
          placeholder="Añadir música por..."
        />
      </LabeledInputWrapper>
    </FlexBox>
  )
}

export default SeriesTagsTab
