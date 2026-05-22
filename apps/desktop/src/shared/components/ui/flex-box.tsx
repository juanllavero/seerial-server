import type React from 'react';
import type { CSSProperties } from 'react';

interface FlexBoxProps {
  children: React.ReactNode;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap';
  justify?:
    | 'start'
    | 'center'
    | 'end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | 'stretch';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  width?: string | number;
  height?: string | number;
  onClick?: (e?: React.MouseEvent) => void;
  gap?: number;
  padding?: string;
  margin?: string;
  scroll?: 'horizontal' | 'vertical';
  hideScrollbar?: boolean;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  css?: CSSProperties;
  style?: CSSProperties;
  onMouseEnter?: (e?: React.MouseEvent) => void;
  onMouseLeave?: (e?: React.MouseEvent) => void;
  onMouseDown?: (e?: React.MouseEvent) => void;
  onMouseUp?: (e?: React.MouseEvent) => void;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  [key: string]: unknown;
}

function FlexBox({
  children,
  direction = 'row',
  wrap = 'nowrap',
  justify = 'start',
  align = 'start',
  width = 'auto',
  height = 'auto',
  gap = 0,
  padding = '0',
  onClick,
  margin = '0',
  className = '',
  scroll,
  hideScrollbar,
  ref,
  css,
  style,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onScroll,
  ...restProps
}: FlexBoxProps) {
  const flexStyle: CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    flexWrap: wrap,
    justifyContent: justify,
    alignItems: align,
    width: width,
    height: height,
    gap: `${gap}rem`,
    padding: padding,
    margin: margin,
    ...css,
    ...style,
  };

  const interactiveProps = onClick
    ? {
        role: ((restProps.role as string | undefined) ?? 'button') as React.AriaRole,
        tabIndex: (restProps.tabIndex as number | undefined) ?? 0,
        onClick,
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }

          const restOnKeyDown = restProps.onKeyDown as
            | ((event: React.KeyboardEvent<HTMLDivElement>) => void)
            | undefined;
          restOnKeyDown?.(e);
        },
      }
    : {};

  const pointerProps = {
    ...(onMouseEnter ? { onMouseEnter } : {}),
    ...(onMouseLeave ? { onMouseLeave } : {}),
    ...(onMouseDown ? { onMouseDown } : {}),
    ...(onMouseUp ? { onMouseUp } : {}),
    ...(onScroll ? { onScroll } : {}),
  };

  return (
    <div
      ref={ref}
      className={`${className} ${hideScrollbar ? 'hide-scrollbar' : ''} scroll-smooth ${scroll === 'horizontal' ? 'overflow-x-auto' : ''} ${scroll === 'vertical' ? 'overflow-y-auto' : ''}`}
      style={flexStyle}
      {...pointerProps}
      {...interactiveProps}
      {...restProps}
    >
      {children}
    </div>
  );
}

export default FlexBox;
