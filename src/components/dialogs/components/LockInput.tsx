import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Lock, LockOpen } from 'lucide-react'
import React from 'react'
import './LockInput.css'

interface LockInputProps {
  lock: boolean
  setLock: (lock: boolean) => void
  value: string
  setValue: (value: string) => void
  isTextArea?: boolean
}

function LockInput({
  lock,
  setLock,
  value,
  setValue,
  isTextArea,
}: LockInputProps) {
  return (
    <FlexBox justify="start" align="center" gap={0.2} width={'100%'}>
      <div
        className={`lock ${lock ? 'locked' : ''}`}
        onClick={() => setLock(!lock)}
      >
        {lock ? <Lock /> : <LockOpen />}
      </div>
      {isTextArea ? (
        <Textarea
          value={value}
          rows={5}
          onChange={(e) => setValue(e.target.value)}
        />
      ) : (
        <Input
          type={'text'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
    </FlexBox>
  )
}

export default LockInput
