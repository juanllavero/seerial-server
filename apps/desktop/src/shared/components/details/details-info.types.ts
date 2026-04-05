import type { DetailsData } from '@seerial/domain';

export interface DetailsInfoProps {
    details: DetailsData | undefined;
    subtitle?: string;
    infoItems?: string[];
    durationInfo?: number;
    timeWatchedInfo?: number;
    handlePlay?: () => void;
    handleMoreOptions?: () => void;
    handleMarkWatched?: () => void;
    handleAddToMyList?: () => void;
    isWatched?: boolean;
    isInMyList?: boolean;
    videoInfo?: string;
    audioInfo?: string;
    subtitleInfo?: string;
    hideButtons?: boolean;
}