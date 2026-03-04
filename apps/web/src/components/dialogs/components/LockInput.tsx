import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import TagInput from '@/components/ui/tags-input'
import { Textarea } from '@/components/ui/textarea'
import { Lock, LockOpen } from 'lucide-react'
import { Control, useController } from 'react-hook-form'
import './LockInput.css'

interface LockInputProps {
  name: string
  control: Control<any>
  lockName?: string
  type?: 'text' | 'textarea'
  placeholder?: string
}

function LockInput({
  name,
  control,
  lockName,
  type = 'text',
  placeholder = '',
}: LockInputProps) {
  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
  })

  const lockController = lockName
    ? useController({
        name: lockName,
        control,
      })
    : null

  const lockValue = lockController?.field.value ?? false
  const onLockChange = lockController?.field.onChange ?? (() => {})

  const handleChange = (newValue: any) => {
    onChange(newValue)
    if (lockName) onLockChange(true) // Set lock to true on change only if lock exists
  }

  return (
    <FlexBox justify="start" align="center" gap={0.2} width={'100%'}>
      {lockName && (
        <div
          className={`lock ${lockValue ? 'locked' : ''}`}
          onClick={() => onLockChange(!lockValue)}
        >
          {lockValue ? <Lock /> : <LockOpen />}
        </div>
      )}
      {Array.isArray(value) ? (
        <TagInput
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
        />
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
  )
}

export default LockInput
