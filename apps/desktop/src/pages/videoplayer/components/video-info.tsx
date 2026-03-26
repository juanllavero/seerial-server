import { formatTimeForView } from '@seerial/domain';
import FlexBox from '@/components/ui/FlexBox';

interface VideoInfoProps {
  title: string;
  subtitle?: string;
  info?: string;
  duration?: number;
}

function VideoInfo({ title, subtitle, info, duration }: VideoInfoProps) {
  return (
    <FlexBox direction="column" gap={0.5}>
      <span className="font-black text-5xl">{title}</span>
      {subtitle && <span className="font-bold text-3xl">{subtitle}</span>}
      <FlexBox gap={0.5} align="center">
        <span className="font-semibold text-xl">{info}</span>
        {duration && duration > 0 ? (
          <span className="font-semibold text-xl">{formatTimeForView(duration / 60)}</span>
        ) : null}
      </FlexBox>
    </FlexBox>
  );
}

export default VideoInfo;
