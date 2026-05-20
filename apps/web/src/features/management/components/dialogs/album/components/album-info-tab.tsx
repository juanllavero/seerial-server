import { useTranslation } from 'react-i18next';
import LabeledInputWrapper from '@/shared/forms/labeled-input-wrapper';
import { useIsTablet } from '@/shared/hooks/use-tablet';
import FlexBox from '@/shared/ui/flex-box';
import { Input } from '@/shared/ui/input';
import TagInput from '@/shared/ui/tags-input';

interface AlbumInfoTabProps {
  title: string;
  setTitle: (name: string) => void;
  year: string;
  setYear: (year: string) => void;
  description: string;
  setDescription: (overview: string) => void;
  genres: string[];
  setGenres: (genres: string[]) => void;
}

function AlbumInfoTab({
  title,
  setTitle,
  year,
  setYear,
  description,
  setDescription,
  genres,
  setGenres,
}: AlbumInfoTabProps) {
  const { t } = useTranslation();
  const isTablet = useIsTablet();

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
      <FlexBox gap={1} width={'100%'} direction={isTablet ? 'column' : 'row'}>
        <LabeledInputWrapper label={t('name')}>
          <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </LabeledInputWrapper>

        <LabeledInputWrapper label={t('year')}>
          <Input type="text" value={year} onChange={(e) => setYear(e.target.value)} />
        </LabeledInputWrapper>
      </FlexBox>

      <LabeledInputWrapper label={t('genres')}>
        <TagInput value={genres} onChange={setGenres} placeholder="Añadir género..." />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('overview')}>
        <Input
          type="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </LabeledInputWrapper>
    </FlexBox>
  );
}

export default AlbumInfoTab;
