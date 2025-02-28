import React from 'react'

interface GridProps {
  columns?: string
  rows?: string
  gap?: string
  padding?: string
  margin?: string
  width?: string
  height?: string
  className?: string
  onClick?: () => void
  children: React.ReactNode
}

function Grid({
  columns = '1fr',
  rows = '1fr',
  gap = '0',
  padding = '0',
  margin = '0',
  width = 'auto',
  height = 'auto',
  className = '',
  onClick,
  children,
}: GridProps) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        gridTemplateRows: rows,
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
