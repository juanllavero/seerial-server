import { useTranslation } from 'react-i18next'
import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'

interface CollectionInfoTabProps {
  title: string
  setTitle: (name: string) => void
  description: string
  setDescription: (year: string) => void
}

function CollectionInfoTab({
  title,
  setTitle,
  description,
  setDescription,
}: CollectionInfoTabProps) {
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
      <LabeledInputWrapper label={t('title')}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} width={'100%'} />
      </LabeledInputWrapper>

      <LabeledInputWrapper label={t('overview')}>
        <Input
          type="textarea"
          value={description}
          width={'100%'}
          onChange={(e) => setDescription(e.target.value)}
        />
      </LabeledInputWrapper>
    </FlexBox>
  )
}

export default CollectionInfoTab
