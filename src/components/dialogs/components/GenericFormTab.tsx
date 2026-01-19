import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import { useIsTablet } from '@/components/hooks/use-tablet'
import FlexBox from '@/components/ui/FlexBox'
import { Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormConfig, FormField } from '../forms.config'
import LockInput from './LockInput'

interface GenericFormTabProps {
  config: FormConfig
  control: Control<any>
}

function GenericFormTab({ config, control }: GenericFormTabProps) {
  const { t } = useTranslation()
  const isTablet = useIsTablet()

  const renderField = (field: FormField) => {
    const lockName = field.hasLock ? `${field.name}Lock` : undefined

    return (
      <LabeledInputWrapper key={field.name} label={t(field.label)}>
        <LockInput
          name={field.name}
          control={control}
          lockName={lockName}
          type={field.type === 'textarea' ? 'textarea' : undefined}
          placeholder={
            field.placeholder ? t(field.placeholder) : `${t(field.label)}...`
          }
        />
      </LabeledInputWrapper>
    )
  }

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
      {config.groups.map((group, groupIndex) => (
        <FlexBox
          key={groupIndex}
          gap={1}
          width="100%"
          direction={
            isTablet && group.direction === 'row' ? 'column' : group.direction
          }
        >
          {group.fields.map((fieldName) => {
            const field = config.fields.find((f) => f.name === fieldName)
            return field ? renderField(field) : null
          })}
        </FlexBox>
      ))}
    </FlexBox>
  )
}

export default GenericFormTab
