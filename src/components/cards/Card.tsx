import React from 'react'
import LazyImage from '../ui/LazyImage'
import { DropdownContent } from '@/data/interfaces/Utils'
import { Button } from '../ui/button'
import DropdownWrapper from '../DropdownWrapper'
import { Check, EllipsisVertical } from 'lucide-react'
import Grid from '../ui/Grid'
import FlexBox from '../ui/FlexBox'
import './Card.css'
import Loading from '../Loading'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { Progress } from '../ui/progress'
import { PlayIcon } from '../ui/IconLibrary'

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
  progress?: number
  cornerNumber?: number
  watched?: boolean
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
  progress,
  cornerNumber,
  watched,
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
        {progress && !watched && (
          <FlexBox
            className="progress"
            justify="end"
            align="end"
            width="100%"
            height={'100%'}
          >
            <Progress value={35} className="rounded-xs" />
          </FlexBox>
        )}
        {(cornerNumber || watched) && (
          <div className="rightCorner">
            <span>{!watched ? cornerNumber : <Check size={20} />}</span>
          </div>
        )}
        <FlexBox
          className="card-hover"
          direction="column"
          justify="space-between"
          align="center"
          width="100%"
          height="100%"
        >
          <FlexBox
            justify="space-between"
            align="start"
            width="100%"
            padding=".3rem"
            gap={0.1}
          >
            <Button variant={'ghost'}>{cornerData}</Button>
            <Button variant={'ghost'}>{cornerData}</Button>
          </FlexBox>
          <FlexBox className="center" justify="center" align="center">
            {loading ? (
              <Loading />
            ) : !hidePlayButton ? (
              <Button
                variant={'ghost'}
                className="rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                <PlayIcon />
              </Button>
            ) : null}
          </FlexBox>
          {!hideButtons && menu && (
            <FlexBox
              justify="space-between"
              align="end"
              width="100%"
              padding=".3rem"
            >
              {editModal}
              <DropdownWrapper
                content={menu}
                button={
                  <Button
                    variant={'ghost'}
                    size={'icon'}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EllipsisVertical size={20} />
                  </Button>
                }
              />
            </FlexBox>
          )}
        </FlexBox>
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
