import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import React from 'react'

interface ContentWrapperProps {
  children: React.ReactNode
  group: string
  section: string
}

function ContentWrapper({ children, group, section }: ContentWrapperProps) {
  const isMobile = useIsMobile()
  return (
    <FlexBox direction="column" gap={1.5} padding={isMobile ? '0' : '.5rem'}>
      <span
        className={` ${isMobile ? 'mb-1 text-lg' : 'mb-4 text-3xl'} font-bold`}
      >
        {group} - {section}
      </span>
      {children}
    </FlexBox>
  )
}

export default ContentWrapper
