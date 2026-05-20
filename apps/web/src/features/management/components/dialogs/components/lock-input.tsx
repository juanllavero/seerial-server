import { Lock, LockOpen } from 'lucide-react';
import { type Control, type FieldValues, useController } from 'react-hook-form';
import FlexBox from '@/shared/ui/flex-box';
import { Input } from '@/shared/ui/input';
import TagInput from '@/shared/ui/tags-input';
import { Textarea } from '@/shared/ui/textarea';
import './lock-input.css';

interface LockInputProps {
  name: string;
  control: Control<FieldValues>;
  lockName?: string;
  type?: 'text' | 'textarea';
  placeholder?: string;
}

function LockInput({ name, control, lockName, type = 'text', placeholder = '' }: LockInputProps) {
  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
  });

  const lockField = useController({
    name: lockName ?? '__lock_disabled__',
    control,
    disabled: !lockName,
  });
  const lockValue = Boolean(lockField.field.value);

  const handleChange = (newValue: string | string[]) => {
    onChange(newValue);
    if (lockName) {
      lockField.field.onChange(true);
    }
  };

  return (
    <FlexBox justify="start" align="center" gap={0.2} width={'100%'}>
      {lockName && (
        <button
          type="button"
          className={`lock ${lockValue ? 'locked' : ''}`}
          onClick={() => lockField.field.onChange(!lockValue)}
        >
          {lockValue ? <Lock /> : <LockOpen />}
        </button>
      )}
      {Array.isArray(value) ? (
        <TagInput value={value} onChange={handleChange} placeholder={placeholder} />
      ) : type === 'textarea' ? (
        <Textarea
          value={value || ''}
          rows={5}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
        />
      ) : (
        <Input
          type="text"
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
        />
      )}
    </FlexBox>
  );
}

export default LockInput;
