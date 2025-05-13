import FlexBox from '@/components/ui/FlexBox'
import { WarningIcon } from '@/components/ui/IconLibrary'
import React from 'react'

interface AlertContentProps {
  title: string
  message: string
  url?: string
  children?: React.ReactNode
}

function AlertContent({ title, message, url, children }: AlertContentProps) {
  const openInNewTab = () => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    if (newWindow) newWindow.opener = null
  }

  return (
    <FlexBox
      direction="column"
      padding="5rem"
      align="center"
      justify="center"
      height={'100%'}
      gap={1}
    >
      <div>
        <WarningIcon />
      </div>
      <span className="text-xl font-semibold">{title}</span>
      <span text->
        {message}{' '}
        <a
          href=""
          style={{ color: 'var(--app-color)' }}
          className="font-semibold"
          onClick={openInNewTab}
        >
          {url}
        </a>
      </span>
      {children}
    </FlexBox>
  )
}

export default AlertContent
