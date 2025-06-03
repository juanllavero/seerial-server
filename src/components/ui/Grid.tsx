import React from 'react'

interface GridProps {
  columns?: string
  rows?: string
  gap?: string
  columnGap?: string
  padding?: string
  margin?: string
  width?: string
  height?: string
  justifyContent?: string
  scroll?: 'horizontal' | 'vertical'
  hideScrollbar?: boolean
  alignItems?: string
  className?: string
  onClick?: () => void
  children: React.ReactNode
}

function Grid({
  columns = '1fr',
  rows = '1fr',
  gap = '0',
  columnGap = '0',
  padding = '0',
  margin = '0',
  width = 'auto',
  height = 'auto',
  justifyContent = 'center',
  alignItems = 'center',
  scroll,
  hideScrollbar,
  className = '',
  onClick,
  children,
}: GridProps) {
  return (
    <div
      className={`${className} ${hideScrollbar ? 'hide-scrollbar' : ''} scroll-smooth ${scroll === 'horizontal' ? 'overflow-x-auto' : ''} ${scroll === 'vertical' ? 'overflow-y-auto' : ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        gridTemplateRows: rows,
        columnGap: columnGap,
        justifyContent: justifyContent,
        alignItems: alignItems,
        gap: gap,
        padding: padding,
        margin: margin,
        width: width,
        height: height,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Grid
