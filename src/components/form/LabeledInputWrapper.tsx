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
      <FlexBox direction={direction} align="center" gap={1}>
        <span>{label}</span>
        {children}
      </FlexBox>
      <span className="mt-1 ml-2 text-sm" style={{ color: 'lightgray' }}>
        {text}
      </span>
    </FlexBox>
  )
}

export default LabeledInputWrapper
