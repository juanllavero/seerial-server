import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import { useTranslation } from 'react-i18next'
import LockInput from '../../components/LockInput'

interface MovieTagsTabProps {
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
  genresLock: boolean
  setGenresLock: (genresLock: boolean) => void
  creatorLock: boolean
  setCreatorLock: (creatorLock: boolean) => void
  directedLock: boolean
  setDirectedLock: (directedLock: boolean) => void
  writtenLock: boolean
  setWrittenLock: (writtenLock: boolean) => void
  musicLock: boolean
  setMusicLock: (musicLock: boolean) => void
}

function MovieTagsTab({
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
  genresLock,
  setGenresLock,
  creatorLock,
  setCreatorLock,
  directedLock,
  setDirectedLock,
  writtenLock,
  setWrittenLock,
  musicLock,
  setMusicLock,
}: MovieTagsTabProps) {
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
      <LabeledInputWrapper label={t('directedBy')}>
        <LockInput
          lock={directedLock}
          setLock={setDirectedLock}
          values={directedBy}
          setValues={setDirectedBy}
          placeholder={`${t('directedBy')}...`}
        />
      </LabeledInputWrapper>
      <LabeledInputWrapper label={t('writtenBy')}>
        <LockInput
          lock={writtenLock}
          setLock={setWrittenLock}
          values={writtenBy}
          setValues={setWrittenBy}
          placeholder={`${t('writtenBy')}...`}
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

export default MovieTagsTab
