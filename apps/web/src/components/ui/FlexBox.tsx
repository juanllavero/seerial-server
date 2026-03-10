import type React from 'react'
import type { CSSProperties } from 'react'

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
  minWidth?: string | number
  minHeight?: string | number
  maxWidth?: string | number
  maxHeight?: string | number
  gap?: number
  padding?: string
  margin?: string
  scroll?: 'horizontal' | 'vertical'
  hideScrollbar?: boolean
  className?: string
  ref?: React.Ref<HTMLDivElement>
  css?: CSSProperties
  onClick?: (e?: React.MouseEvent) => void
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
  minWidth = 'auto',
  minHeight = 'auto',
  maxWidth = 'auto',
  maxHeight = 'auto',
  gap = 0,
  padding = '0',
  margin = '0',
  className = '',
  scroll,
  hideScrollbar,
  ref,
  css,
  onClick,
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
        minWidth: minWidth,
        minHeight: minHeight,
        maxWidth: maxWidth,
        maxHeight: maxHeight,
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
