import FlexBox from '@/components/ui/FlexBox'
import React from 'react'

interface ContentWrapperProps {
  children: React.ReactNode
}

function ContentWrapper({ children }: ContentWrapperProps) {
  return (
    <FlexBox direction="column" gap={1.5} padding=".5rem">
      {children}
    </FlexBox>
  )
}

export default ContentWrapper
