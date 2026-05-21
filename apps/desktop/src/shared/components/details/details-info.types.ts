import type { CastData, DetailsData } from '@seerial/domain';

interface DetailsInfoDisplayOptions {
  isWatched?: boolean;
  hideUnwatchedThumbnails?: boolean;
  hideButtons?: boolean;
}

interface DetailsInfoBehaviorOptions {
  enableKeyboardBack?: boolean;
  disableInitialFocus?: boolean;
}

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
  videoInfo?: string;
  audioInfo?: string;
  subtitleInfo?: string;
  displayOptions?: DetailsInfoDisplayOptions;
  behaviorOptions?: DetailsInfoBehaviorOptions;
  cast?: CastData[];
  expandedImageSrc?: string;
  expandedTitle?: string;
  onDescriptionExpandedChange?: (expanded: boolean) => void;
}
