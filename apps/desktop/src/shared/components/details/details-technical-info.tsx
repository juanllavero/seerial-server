import { Subtitles, Volume2 } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import FlexBox from '@/shared/components/ui/flex-box';
import Tertiary from '../text/tertiary';

interface DetailsTechnicalInfoProps {
  videoInfo?: string;
  audioInfo?: string;
  subtitleInfo?: string;
}

function DetailsTechnicalInfo({ videoInfo, audioInfo, subtitleInfo }: DetailsTechnicalInfoProps) {
  if (!videoInfo && !audioInfo && !subtitleInfo) {
    return null;
  }

  return (
    <FlexBox direction="row" gap={2}>
      {videoInfo && (
        <Card className="px-3 border-none">
          <Tertiary className="text-stone-300!">{videoInfo}</Tertiary>
        </Card>
      )}
      {audioInfo && (
        <Card className="px-3 border-none flex items-center gap-3">
          <Volume2 />
          <Tertiary className="text-stone-300!">{audioInfo}</Tertiary>
        </Card>
      )}
      {subtitleInfo && (
        <Card className="px-3 border-none flex items-center gap-3">
          <Subtitles />
          <Tertiary className="text-stone-300!">{subtitleInfo}</Tertiary>
        </Card>
      )}
    </FlexBox>
  );
}

export default DetailsTechnicalInfo;
