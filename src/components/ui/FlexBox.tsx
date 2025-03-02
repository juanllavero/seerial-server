import React from 'react'

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
  className?: string
  onMouseEnter?: (e?: React.MouseEvent) => void
  onMouseLeave?: (e?: React.MouseEvent) => void
  onMouseDown?: (e?: React.MouseEvent) => void
  onMouseUp?: (e?: React.MouseEvent) => void
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
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
}: FlexBoxProps) {
  return (
    <div
      className={className}
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
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {children}
    </div>
  )
}

export default FlexBox
