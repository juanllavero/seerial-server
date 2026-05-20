import { formatTimeForView } from '@seerial/domain';
import { Subtitle, Tertiary, Title } from '@/shared/components/text';
import FlexBox from '@/shared/components/ui/flex-box';

interface VideoInfoProps {
  title: string;
  subtitle?: string;
  info?: string;
  duration?: number;
}

function VideoInfo({ title, subtitle, info, duration }: VideoInfoProps) {
  return (
    <FlexBox direction="column" gap={0.5}>
      <Title className="font-black text-5xl">{title}</Title>
      {subtitle && <Subtitle className="font-bold text-3xl">{subtitle}</Subtitle>}
      <FlexBox gap={0.5} align="center">
        <Tertiary className="font-semibold text-xl">{info}</Tertiary>
        {duration && duration > 0 ? (
          <Tertiary className="font-semibold text-xl">{formatTimeForView(duration / 60)}</Tertiary>
        ) : null}
      </FlexBox>
    </FlexBox>
  );
}

export default VideoInfo;
