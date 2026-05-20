import type { CastData, DetailsData } from '@seerial/domain';

export interface DetailsInfoProps {
  details: DetailsData | undefined;
  customDescription?: string;
  subtitle?: string;
  infoItems?: string[];
  durationInfo?: number;
  timeWatchedInfo?: number;
  handlePlay?: () => void;
  handleMoreOptions?: () => void;
  handleMarkWatched?: () => void;
  handleToggleHideThumbnails?: () => void;
  isWatched?: boolean;
  hideUnwatchedThumbnails?: boolean;
  videoInfo?: string;
  audioInfo?: string;
  subtitleInfo?: string;
  hideButtons?: boolean;
  enableKeyboardBack?: boolean;
  disableInitialFocus?: boolean;
  cast?: CastData[];
  expandedImageSrc?: string;
  expandedTitle?: string;
  onDescriptionExpandedChange?: (expanded: boolean) => void;
}
