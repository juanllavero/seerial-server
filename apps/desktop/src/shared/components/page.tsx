import type React from 'react';
import FlexBox from '../../components/ui/FlexBox';

interface PageProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  className?: string;
  justify?:
    | 'start'
    | 'center'
    | 'end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | 'stretch';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  padding?: string;
  margin?: string;
  gap?: number;
}

function Page({
  children,
  direction = 'column',
  padding = '2rem 3rem',
  justify = 'start',
  align = 'start',
  margin,
  gap = 1,
  className,
}: PageProps) {
  return (
    <FlexBox
      direction={direction}
      padding={padding}
      margin={margin}
      justify={justify}
      align={align}
      gap={gap}
      height={'100dvh'}
      width={'100dvw'}
      hideScrollbar
      className={className}
    >
      {children}
    </FlexBox>
  );
}

export default Page;
