import type React from 'react';
import { memo } from 'react';

interface AppTextProps {
  className?: string;
  style?: React.CSSProperties;
  noShadow?: boolean;
  children: React.ReactNode;
}

const Tertiary = ({ className, style, noShadow, children, ...props }: AppTextProps) => {
  return (
    <span
      className={`${className} font-medium text-[2vh] text-neutral-200`}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
};

export default memo(Tertiary);
