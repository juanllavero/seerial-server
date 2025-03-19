import FlexBox from '@/components/ui/FlexBox'
import React from 'react'

interface ContentWrapperProps {
  children: React.ReactNode
  group: string
  section: string
}

function ContentWrapper({ children, group, section }: ContentWrapperProps) {
  return (
    <FlexBox direction="column" gap={1.5} padding=".5rem">
      <span className="mb-4 text-3xl font-bold">
        {group} - {section}
      </span>
      {children}
    </FlexBox>
  )
}

export default ContentWrapper
