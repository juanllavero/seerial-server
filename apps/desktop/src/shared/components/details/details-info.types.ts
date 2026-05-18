import type { DetailsData } from '@seerial/domain';

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
  isWatched?: boolean;
  videoInfo?: string;
  audioInfo?: string;
  subtitleInfo?: string;
  hideButtons?: boolean;
  enableKeyboardBack?: boolean;
  disableInitialFocus?: boolean;
}
