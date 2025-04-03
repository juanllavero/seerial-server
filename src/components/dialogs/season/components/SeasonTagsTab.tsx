import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import TagInput from '@/components/ui/tags-input'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface SeasonTagsTabProps {
  genres: string[]
  setGenres: (genres: string[]) => void
  creator: string[]
  setCreator: (creator: string[]) => void
  directedBy: string[]
  setDirectedBy: (directedBy: string[]) => void
  writtenBy: string[]
  setWrittenBy: (writtenBy: string[]) => void
  music: string[]
  setMusic: (music: string[]) => void
}

function SeasonTagsTab({
  genres,
  setGenres,
  creator,
  setCreator,
  directedBy,
  setDirectedBy,
  writtenBy,
  setWrittenBy,
  music,
  setMusic,
}: SeasonTagsTabProps) {
  const { t } = useTranslation()
  const isTablet = useIsTablet()
  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="start"
      align="center"
      height={isTablet ? '25rem' : '35rem'}
      width={isTablet ? '100%' : '50rem'}
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
      <LabeledInputWrapper label={t('directedBy')}>
        <TagInput
          value={directedBy}
          onChange={setDirectedBy}
          placeholder="Añadir director..."
        />
      </LabeledInputWrapper>
      <LabeledInputWrapper label={t('writtenBy')}>
        <TagInput
          value={writtenBy}
          onChange={setWrittenBy}
          placeholder="Añadir escrito por..."
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

export default SeasonTagsTab
