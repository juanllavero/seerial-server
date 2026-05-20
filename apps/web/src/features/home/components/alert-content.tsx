import type React from 'react';
import FlexBox from '@/shared/ui/flex-box';
import { WarningIcon } from '@/shared/ui/icon-library';

interface AlertContentProps {
  title: string;
  message: string;
  url?: string;
  children?: React.ReactNode;
}

function AlertContent({ title, message, url, children }: AlertContentProps) {
  const openInNewTab = () => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null;
  };

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
      <span className="text-center text-xl font-semibold">{title}</span>
      <span className="text-center">
        {message}{' '}
        <button
          type="button"
          style={{ color: 'var(--app-color)' }}
          className="font-semibold"
          onClick={openInNewTab}
        >
          {url}
        </button>
      </span>
      {children}
    </FlexBox>
  );
}

export default AlertContent;
