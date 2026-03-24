import type React from 'react';
import { memo } from 'react';

interface AppTextProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const Subtitle = ({ className, style, children, ...props }: AppTextProps) => {
  return (
    <span
      className={`${className} font-bold text-[4vh] pb-5 text-neutral-200`}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
};

export default memo(Subtitle);
