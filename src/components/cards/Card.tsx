import { DropdownContent } from '@/data/interfaces/Utils'
import { Check, EllipsisVertical } from 'lucide-react'
import React from 'react'
import DropdownWrapper from '../DropdownWrapper'
import Loading from '../Loading'
import { Button } from '../ui/button'
import FlexBox from '../ui/FlexBox'
import { PlayIcon } from '../ui/IconLibrary'
import LazyImage from '../ui/LazyImage'
import { Progress } from '../ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import './Card.css'

interface CardProps {
  itemKey: string
  imgSrc: string
  aspectRatio: number
  width: string | number
  title: string
  subtitle: string
  action: () => void
  playButtonAction?: () => void
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
  errorSrc?: string
}

function Card({
  itemKey,
  imgSrc,
  aspectRatio,
  width,
  title,
  subtitle,
  action,
  playButtonAction,
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
  errorSrc,
}: CardProps) {
  return (
    <FlexBox
      className="card-container"
      direction="column"
      justify="center"
      gap={0.1}
      width={width}
      key={itemKey}
      onClick={(e) => {
        if (e) e.stopPropagation()
        action()
      }}
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
          {!hideButtons && (
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
          )}
          <FlexBox
            className="center"
            justify="center"
            align="center"
            width={'100%'}
            height={'100%'}
          >
            {loading ? (
              <Loading />
            ) : !hidePlayButton ? (
              <Button
                variant={'ghost'}
                className="rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  if (playButtonAction) playButtonAction()
                }}
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
              onClick={(e) => {
                if (e) e.stopPropagation()
              }}
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
          height={typeof width === 'number' ? width / aspectRatio : undefined}
          alt={title}
          errorSrc={errorSrc}
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
