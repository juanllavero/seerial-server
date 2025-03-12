import React from 'react'
import FlexBox from '../ui/FlexBox'

interface LabeledInputWrapperProps {
  direction?: 'row' | 'column'
  label: string
  text?: string
  children: React.ReactNode
}

function LabeledInputWrapper({
  direction = 'column',
  label,
  text,
  children,
}: LabeledInputWrapperProps) {
  return (
    <FlexBox direction="column">
      <FlexBox
        direction={direction}
        align={direction === 'column' ? 'start' : 'center'}
        wrap={direction === 'column' ? 'nowrap' : 'wrap'}
        gap={1}
      >
        <span>{label}</span>
        {children}
      </FlexBox>
      <span className="mt-2 ml-2 text-sm" style={{ color: 'lightgray' }}>
        {text}
      </span>
    </FlexBox>
  )
}

export default LabeledInputWrapper
