import type { DropdownContent } from '@seerial/domain';
import { useIsAdmin } from '@seerial/hooks';
import { Check, EllipsisVertical } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import DropdownWrapper from '../ui/dropdown-wrapper';
import FlexBox from '../ui/flex-box';
import { PlayIcon } from '../ui/icon-library';
import LazyImage from '../ui/lazy-image';
import Loading from '../ui/loading';
import { Progress } from '../ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import './card.css';

interface CardProps {
  itemKey: string;
  imgSrc: string;
  aspectRatio: number;
  width: string;
  title: string;
  subtitle: string;
  action: () => void;
  playButtonAction?: () => void;
  hideButtons?: boolean;
  menu?: DropdownContent;
  loading?: boolean;
  editModal?: React.ReactNode;
  cornerData?: string;
  centerText?: boolean;
  hidePlayButton?: boolean;
  progress?: number;
  cornerNumber?: number;
  watched?: boolean;
  errorSrc?: string;
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
  const [playButtonHovered, setPlayButtonHovered] = useState(false);
  const isAdmin = useIsAdmin();

  return (
    <FlexBox
      direction="column"
      justify="center"
      gap={0.1}
      width={width}
      key={itemKey}
      onClick={(e) => {
        if (e) e.stopPropagation();
        action();
      }}
    >
      <div className={`card ${loading ? 'loading' : ''}`}>
        {progress && !watched && (
          <FlexBox className="progress" justify="end" align="end" width="100%" height={'100%'}>
            <Progress value={progress} className="rounded-xs" />
          </FlexBox>
        )}
        {(cornerNumber || watched) && (
          <div className="rightCorner">
            <span>{watched ? <Check size={20} /> : cornerNumber}</span>
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
          {!hideButtons && isAdmin && (
            <FlexBox justify="space-between" align="start" width="100%" padding=".3rem" gap={0.1}>
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
            ) : hidePlayButton ? null : (
              <Button
                variant={'ghost'}
                className="bg-accent h-fit w-fit rounded-full p-3"
                onMouseEnter={() => setPlayButtonHovered(true)}
                onMouseLeave={() => setPlayButtonHovered(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (playButtonAction) playButtonAction();
                }}
                style={{
                  backgroundColor: playButtonHovered ? 'var(--app-color)' : '',
                }}
              >
                <PlayIcon size={35} color={playButtonHovered ? '#1a1a1a' : 'white'} />
              </Button>
            )}
          </FlexBox>
          {!hideButtons && menu && isAdmin && (
            <FlexBox
              justify="space-between"
              align="end"
              width="100%"
              onClick={(e) => {
                if (e) e.stopPropagation();
              }}
              padding=".3rem"
            >
              {editModal}
              <DropdownWrapper
                content={menu}
                button={
                  <Button variant={'ghost'} size={'icon'} onClick={(e) => e.stopPropagation()}>
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
          alt={title}
          aspectRatio={String(aspectRatio)}
        />
      </div>
      <div
        className="grid p-2"
        style={{
          width: width,
          textAlign: centerText ? 'center' : 'left',
          justifyItems: centerText ? 'center' : 'start',
          alignItems: 'start',
          minWidth: 0,
        }}
      >
        <Tooltip>
          <TooltipTrigger className="max-w-full truncate">
            {/** biome-ignore lint/a11y/noStaticElementInteractions: <No need> */}
            {/** biome-ignore lint/a11y/useValidAnchor: <No need> */}
            <a className="a_text" id="title ellipsis truncate" onClick={action}>
              {title}
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <span className="text-base font-bold">{title}</span>
          </TooltipContent>
        </Tooltip>

        <span id="subtitle">{subtitle}</span>
      </div>
    </FlexBox>
  );
}

export default Card;
