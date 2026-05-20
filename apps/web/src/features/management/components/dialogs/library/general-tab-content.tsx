import ISO6391 from 'iso-639-1';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LabeledInputWrapper from '@/shared/forms/labeled-input-wrapper';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useIsTablet } from '@/shared/hooks/use-tablet';
import { themdbLanguages } from '@/shared/lib/the-movie-db-languages';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';
import { Input } from '@/shared/ui/input';
import SelectableWrapper from '@/shared/ui/selectable-wrapper';
import LibraryTypeButton from './library-type-button';

interface GeneralTabContentProps {
  type: string | undefined;
  setType: (type: string | undefined) => void;
  name: string;
  setName: (name: string) => void;
  setLanguage: (language: string | undefined) => void;
  disableButton: boolean;
  onSave: () => void;
  close: () => void;
  edit?: boolean;
}

function GeneralTabContent({
  type,
  setType,
  name,
  setName,
  setLanguage,
  disableButton,
  onSave,
  close,
  edit,
}: GeneralTabContentProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language?.split('-')[0] ?? 'en';
  const isTablet = useIsTablet();
  const isMobile = useIsMobile();

  useEffect(() => {
    setLanguage(currentLanguage);
  }, [currentLanguage, setLanguage]);

  return (
    <FlexBox
      direction="column"
      gap={1}
      align="stretch"
      justify="space-between"
      height={'27rem'}
      width={'100%'}
    >
      <FlexBox direction="column" gap={1} align="center">
        <span>{t('type')}</span>
        <FlexBox align="center" justify="center">
          <LibraryTypeButton
            selectedType={type}
            type="movies"
            onClick={() => {
              setType('Movies');
              setName(t('movies'));
            }}
            disabled={edit}
          />

          <LibraryTypeButton
            selectedType={type}
            type="shows"
            onClick={() => {
              setType('Shows');
              setName(t('shows'));
            }}
            disabled={edit}
          />

          <LibraryTypeButton
            selectedType={type}
            type="music"
            onClick={() => {
              setType('Music');
              setName(t('music'));
            }}
            disabled={edit}
          />
        </FlexBox>

        {type && (
          <FlexBox
            gap={1}
            margin="1rem 0 0 0"
            align="center"
            width={isTablet ? '80%' : isMobile ? '70%' : '100%'}
            direction="column"
          >
            <LabeledInputWrapper label={t('name')}>
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </LabeledInputWrapper>

            <LabeledInputWrapper label={t('languageText')}>
              <SelectableWrapper
                defaultValue={ISO6391.getNativeName(currentLanguage) || currentLanguage}
                onValueChange={(_key: string, value: string) => setLanguage(value)}
                options={themdbLanguages.map((language) => ({
                  key: language.iso_639_1,
                  value: ISO6391.getNativeName(language.iso_639_1) || language.iso_639_1,
                }))}
              />
            </LabeledInputWrapper>
          </FlexBox>
        )}
      </FlexBox>

      <FlexBox width={'100%'} justify="end" gap={1}>
        <Button variant={'secondary'} onClick={close}>
          {t('cancelButton')}
        </Button>
        <Button onClick={onSave} disabled={!type || disableButton}>
          {t(edit ? 'saveButton' : 'next')}
        </Button>
      </FlexBox>
    </FlexBox>
  );
}

export default GeneralTabContent;
