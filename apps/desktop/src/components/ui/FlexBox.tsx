import React, { CSSProperties } from 'react'

interface FlexBoxProps {
  children: React.ReactNode
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  wrap?: 'nowrap' | 'wrap'
  justify?:
    | 'start'
    | 'center'
    | 'end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | 'stretch'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  width?: string | number
  height?: string | number
  onClick?: (e?: React.MouseEvent) => void
  gap?: number
  padding?: string
  margin?: string
  scroll?: 'horizontal' | 'vertical'
  hideScrollbar?: boolean
  className?: string
  ref?: React.Ref<HTMLDivElement>
  css?: CSSProperties
  onMouseEnter?: (e?: React.MouseEvent) => void
  onMouseLeave?: (e?: React.MouseEvent) => void
  onMouseDown?: (e?: React.MouseEvent) => void
  onMouseUp?: (e?: React.MouseEvent) => void
  onScroll?: React.UIEventHandler<HTMLDivElement>
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
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onScroll,
}: FlexBoxProps) {
  return (
    <div
      ref={ref}
      className={`${className} ${hideScrollbar ? 'hide-scrollbar' : ''} scroll-smooth ${scroll === 'horizontal' ? 'overflow-x-auto' : ''} ${scroll === 'vertical' ? 'overflow-y-auto' : ''}`}
      style={{
        display: 'flex',
        flexDirection: direction,
        flexWrap: wrap,
        justifyContent: justify,
        alignItems: align,
        width: width,
        height: height,
        gap: gap + 'rem',
        padding: padding,
        margin: margin,
        ...css,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onScroll={onScroll}
    >
      {children}
    </div>
  )
}

export default FlexBox
