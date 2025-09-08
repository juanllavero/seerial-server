import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Lock, LockOpen } from 'lucide-react'
import './LockInput.css'
import TagInput from '@/components/ui/tags-input'

interface LockInputProps {
  lock: boolean
  setLock: (lock: boolean) => void
  value?: string
  setValue?: (value: string) => void
  values?: string[]
  setValues?: (values: string[]) => void
  type?: 'text' | 'textarea'
  placeholder?: string
}

function LockInput({
  lock,
  setLock,
  value,
  setValue,
  values,
  setValues,
  type = 'text',
  placeholder = '',
}: LockInputProps) {
  console.log({ value, values })
  return (
    <FlexBox justify="start" align="center" gap={0.2} width={'100%'}>
      <div
        className={`lock ${lock ? 'locked' : ''}`}
        onClick={() => setLock(!lock)}
      >
        {lock ? <Lock /> : <LockOpen />}
      </div>
      {value !== undefined && setValue !== undefined ? (
        type === 'textarea' ? (
          <Textarea
            value={value}
            rows={5}
            placeholder={placeholder}
            onChange={(e) => {
              setValue(e.target.value)
              setLock(true)
            }}
          />
        ) : (
          <Input
            type={'text'}
            value={value}
            placeholder={placeholder}
            onChange={(e) => {
              setValue(e.target.value)
              setLock(true)
            }}
          />
        )
      ) : values !== undefined && setValues !== undefined ? (
        <TagInput
          value={values}
          onChange={(newValues) => {
            setValues(newValues)
            setLock(true)
          }}
          placeholder={placeholder}
        />
      ) : null}
    </FlexBox>
  )
}

export default LockInput
