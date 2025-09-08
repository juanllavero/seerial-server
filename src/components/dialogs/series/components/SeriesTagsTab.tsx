import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import TagInput from '@/components/ui/tags-input'
import { useTranslation } from 'react-i18next'
import LockInput from '../../components/LockInput'

interface SeriesTagsTabProps {
  genres: string[]
  setGenres: (genres: string[]) => void
  creator: string[]
  setCreator: (creator: string[]) => void
  studios: string[]
  setStudios: (studios: string[]) => void
  music: string[]
  setMusic: (music: string[]) => void
  genresLock: boolean
  setGenresLock: (genresLock: boolean) => void
  creatorLock: boolean
  setCreatorLock: (creatorLock: boolean) => void
  studiosLock: boolean
  setStudiosLock: (studiosLock: boolean) => void
  musicLock: boolean
  setMusicLock: (musicLock: boolean) => void
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
  genresLock,
  setGenresLock,
  studiosLock,
  setStudiosLock,
  creatorLock,
  setCreatorLock,
  musicLock,
  setMusicLock,
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
        <LockInput
          lock={genresLock}
          setLock={setGenresLock}
          values={genres}
          setValues={setGenres}
          placeholder={`${t('genres')}...`}
        />
      </LabeledInputWrapper>
      <LabeledInputWrapper label={t('createdBy')}>
        <LockInput
          lock={creatorLock}
          setLock={setCreatorLock}
          values={creator}
          setValues={setCreator}
          placeholder={`${t('createdBy')}...`}
        />
      </LabeledInputWrapper>
      <LabeledInputWrapper label={t('studios')}>
        <LockInput
          lock={studiosLock}
          setLock={setStudiosLock}
          values={studios}
          setValues={setStudios}
          placeholder={`${t('studios')}...`}
        />
      </LabeledInputWrapper>
      <LabeledInputWrapper label={t('musicBy')}>
        <LockInput
          lock={musicLock}
          setLock={setMusicLock}
          values={music}
          setValues={setMusic}
          placeholder={`${t('musicBy')}...`}
        />
      </LabeledInputWrapper>
    </FlexBox>
  )
}

export default SeriesTagsTab
