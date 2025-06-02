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

  const cardWidth = localStorage.getItem('cardWidth')
    ? Number(localStorage.getItem('cardWidth')) * 0.8
    : 200 * 0.8

  return (
    <Card
      itemKey={itemKey}
      width={isTablet ? cardWidth * 1.2 : cardWidth}
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
