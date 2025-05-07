import Card from '@/components/cards/Card'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { DropdownContent } from '@/data/interfaces/Utils'
import React from 'react'

interface CardProps {
  type: string
  itemKey: string
  imgSrc: string
  title: string
  subtitle: string
  watched?: boolean
  loading?: boolean
  action: () => void
  cornerNumber?: number
  hidePlayButton?: boolean
  menuContent?: DropdownContent
  editModal?: React.ReactNode
  errorSrc?: string
}

function ParentCard({
  type,
  itemKey,
  title,
  imgSrc,
  subtitle,
  watched,
  loading,
  action,
  cornerNumber,
  hidePlayButton,
  menuContent,
  editModal,
  errorSrc,
}: CardProps) {
  const isTablet = useIsTablet()
  return (
    <Card
      itemKey={itemKey}
      width={isTablet ? '100%' : 200}
      imgSrc={imgSrc}
      aspectRatio={type === 'Music' ? 1 : 2 / 3}
      title={title}
      subtitle={subtitle}
      cornerData=""
      cornerNumber={cornerNumber}
      action={action}
      watched={watched}
      loading={loading}
      hidePlayButton={hidePlayButton}
      menu={menuContent}
      editModal={editModal}
      errorSrc={errorSrc}
    />
  )
}

export default ParentCard
