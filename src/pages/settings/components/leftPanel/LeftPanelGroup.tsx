import FlexBox from '@/components/ui/FlexBox'
import React from 'react'

function LeftPanelGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <FlexBox direction="column" gap={0.5}>
      <span className="mb-1 text-lg font-semibold">{title}</span>
      {children}
    </FlexBox>
  )
}

export default LeftPanelGroup
