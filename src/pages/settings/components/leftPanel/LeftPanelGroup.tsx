import { useIsMobile } from '@/components/hooks/use-mobile'
import FlexBox from '@/components/ui/FlexBox'
import React from 'react'

function LeftPanelGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  return (
    <FlexBox direction="column" gap={0.5}>
      <span
        className={`mb-1 ${isMobile ? 'text-md' : 'text-lg'} font-semibold`}
      >
        {title}
      </span>
      {children}
    </FlexBox>
  )
}

export default LeftPanelGroup
