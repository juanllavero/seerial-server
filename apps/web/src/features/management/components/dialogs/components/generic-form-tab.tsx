import type { Control, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import LabeledInputWrapper from '@/shared/forms/labeled-input-wrapper';
import { useIsTablet } from '@/shared/hooks/use-tablet';
import FlexBox from '@/shared/ui/flex-box';
import type { FormConfig, FormField } from '../forms-config';
import LockInput from './lock-input';

interface GenericFormTabProps {
  config: FormConfig;
  control: Control<FieldValues>;
}

function GenericFormTab({ config, control }: GenericFormTabProps) {
  const { t } = useTranslation();
  const isTablet = useIsTablet();

  const renderField = (field: FormField) => {
    const lockName = field.hasLock ? `${field.name}Lock` : undefined;

    return (
      <LabeledInputWrapper key={field.name} label={t(field.label)}>
        <LockInput
          name={field.name}
          control={control}
          lockName={lockName}
          type={field.type === 'textarea' ? 'textarea' : undefined}
          placeholder={field.placeholder ? t(field.placeholder) : `${t(field.label)}...`}
        />
      </LabeledInputWrapper>
    );
  };

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
          direction={isTablet && group.direction === 'row' ? 'column' : group.direction}
        >
          {group.fields.map((fieldName) => {
            const field = config.fields.find((f) => f.name === fieldName);
            return field ? renderField(field) : null;
          })}
        </FlexBox>
      ))}
    </FlexBox>
  );
}

export default GenericFormTab;
