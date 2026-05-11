import { Subtitles, Volume2 } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import FlexBox from '@/shared/components/ui/flex-box';
import { Tertiary } from '../text';

interface DetailsTechnicalInfoProps {
  videoInfo?: string;
  audioInfo?: string;
  subtitleInfo?: string;
}

function DetailsTechnicalInfo({ videoInfo, audioInfo, subtitleInfo }: DetailsTechnicalInfoProps) {
  console.log('Technical Info:', { videoInfo, audioInfo, subtitleInfo }); // Debug log to check the values

  if (!videoInfo && !audioInfo && !subtitleInfo) {
    return null;
  }

  return (
    <FlexBox direction="row" gap={2}>
      {videoInfo && (
        <Card className="px-3 border-none">
          <Tertiary>{videoInfo}</Tertiary>
        </Card>
      )}
      {audioInfo && (
        <Card className="px-3 border-none flex items-center gap-3">
          <Volume2 />
          <Tertiary>{audioInfo}</Tertiary>
        </Card>
      )}
      {subtitleInfo && (
        <Card className="px-3 border-none flex items-center gap-3">
          <Subtitles />
          <Tertiary>{subtitleInfo}</Tertiary>
        </Card>
      )}
    </FlexBox>
  );
}

export default DetailsTechnicalInfo;
