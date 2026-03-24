import type React from 'react';
import { memo } from 'react';

interface AppTextProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const ListTitle = ({ className, style, children, ...props }: AppTextProps) => {
  return (
    <span className={`${className} font-semibold text-[3vh] text-white`} style={style} {...props}>
      {children}
    </span>
  );
};

export default memo(ListTitle);
