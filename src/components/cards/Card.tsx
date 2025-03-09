import React from 'react'
import LazyImage from '../ui/LazyImage'
import { DropdownContent } from '@/data/interfaces/Utils'
import { Button } from '../ui/button'
import DropdownWrapper from '../DropdownWrapper'
import { EllipsisVertical, Play } from 'lucide-react'
import Grid from '../ui/Grid'
import FlexBox from '../ui/FlexBox'
import './Card.css'
import Loading from '../Loading'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface CardProps {
  itemKey: string
  imgSrc: string
  aspectRatio: number
  width: number
  title: string
  subtitle: string
  action: () => void
  hideButtons?: boolean
  menu?: DropdownContent
  loading?: boolean
  editModal?: React.ReactNode
  cornerData?: string
  centerText?: boolean
  hidePlayButton?: boolean
}

function Card({
  itemKey,
  imgSrc,
  aspectRatio,
  width,
  title,
  subtitle,
  action,
  menu,
  hideButtons,
  loading,
  editModal,
  cornerData,
  centerText,
  hidePlayButton,
}: CardProps) {
  return (
    <FlexBox
      className="card-container"
      direction="column"
      justify="center"
      gap={0.1}
      width={width}
      key={itemKey}
      onClick={action}
    >
      <div className={`card ${loading ? 'loading' : ''}`}>
        <Grid
          className="card-hover"
          rows="1fr 1fr 1fr"
          width="100%"
          height="100%"
        >
          <FlexBox
            className="top"
            justify="space-between"
            align="start"
            padding=".3rem"
          >
            <Button variant={'ghost'}>{cornerData}</Button>
            <Button variant={'ghost'}>{cornerData}</Button>
          </FlexBox>
          <FlexBox className="center" justify="center" align="center">
            {loading ? (
              <Loading />
            ) : !hidePlayButton ? (
              <Button variant={'ghost'} className="rounded-full">
                <Play />
              </Button>
            ) : null}
          </FlexBox>
          {!hideButtons && menu && (
            <FlexBox
              className="bottom"
              justify="space-between"
              align="end"
              padding=".3rem"
            >
              {editModal}
              <DropdownWrapper
                content={menu}
                button={
                  <Button variant={'ghost'}>
                    <EllipsisVertical />
                  </Button>
                }
              />
            </FlexBox>
          )}
        </Grid>
        <LazyImage
          key={itemKey}
          url={imgSrc}
          width={width}
          height={width / aspectRatio}
          alt={title}
        />
      </div>
      <FlexBox
        direction="column"
        padding=".5rem"
        width={width}
        align={centerText ? 'center' : 'start'}
      >
        <Tooltip>
          <TooltipTrigger className="max-w-full truncate">
            <a className="a_text" id="title" onClick={action}>
              {title}
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <span className="text-base font-bold">{title}</span>
          </TooltipContent>
        </Tooltip>

        <span id="subtitle">{subtitle}</span>
      </FlexBox>
    </FlexBox>
  )
}

export default React.memo(Card)
