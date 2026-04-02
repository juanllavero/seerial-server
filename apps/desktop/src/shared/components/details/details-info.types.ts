import type { DetailsData } from '@seerial/domain';

export interface DetailsInfoProps {
    details: DetailsData | undefined;
    subtitle?: string;
    infoItems?: string[];
    durationInfo?: number;
    timeWatchedInfo?: number;
    handlePlay?: () => void;
    bigLogo?: boolean;
    videoInfo?: string;
    audioInfo?: string;
    subtitleInfo?: string;
    hideButtons?: boolean;
}