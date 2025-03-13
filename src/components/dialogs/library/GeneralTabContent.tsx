import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import LibraryTypeButton from './LibraryTypeButton'

function GeneralTabContent() {
  const { t } = useTranslation()
  const [selectedType, setSelectedType] = useState<string | undefined>()

  return (
    <FlexBox
      direction="column"
      gap={1}
      justify="space-between"
      height={'25rem'}
      width={'30rem'}
    >
      <FlexBox direction="column" gap={1}>
        <span>{t('type')}</span>
        <FlexBox>
          <LibraryTypeButton
            selectedType={selectedType}
            type="Movies"
            onClick={() => setSelectedType('Movies')}
          />

          <LibraryTypeButton
            selectedType={selectedType}
            type="Shows"
            onClick={() => setSelectedType('Shows')}
          />

          <LibraryTypeButton
            selectedType={selectedType}
            type="Music"
            onClick={() => setSelectedType('Music')}
          />
        </FlexBox>

        {selectedType && (
          <FlexBox gap={1} margin="1rem 0 0 0">
            <LabeledInputWrapper label={t('name')}>
              <Input type="text" />
            </LabeledInputWrapper>

            <LabeledInputWrapper label={t('languageText')}>
              <Input type="text" />
            </LabeledInputWrapper>
          </FlexBox>
        )}
      </FlexBox>

      <FlexBox width={'100%'} justify="end" gap={1}>
        <Button variant={'secondary'}>{t('cancelButton')}</Button>
        <Button>{t('next')}</Button>
      </FlexBox>
    </FlexBox>
  )
}

export default GeneralTabContent
