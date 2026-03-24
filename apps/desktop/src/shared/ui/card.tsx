import { setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { useEffect } from 'react';
import FlexBox from '../../components/ui/FlexBox';
import Image from '../../components/ui/Image';

const IMAGE_HEIGHT_PERCENTAGE = 0.9;

function parseAspectRatio(aspectRatio: string) {
  if (aspectRatio.includes('/')) {
    const [width, height] = aspectRatio.split('/').map(Number);

    if (Number.isFinite(width) && Number.isFinite(height) && height > 0) {
      return width / height;
    }
  }

  const numericAspectRatio = Number.parseFloat(aspectRatio);

  if (Number.isFinite(numericAspectRatio) && numericAspectRatio > 0) {
    return numericAspectRatio;
  }

  return 1;
}

interface CardProps {
  imgSrc: string;
  aspectRatio?: string;
  width?: string;
  height?: string;
  title?: string;
  subtitle?: string;
  action: () => void;
  onFocus?: () => void;
  customKey?: string;
}

function ContentCard({
  imgSrc,
  aspectRatio = '2/3',
  width = 'auto',
  title,
  subtitle,
  action,
  onFocus,
  customKey,
}: CardProps) {
  const mediaAspectRatio = parseAspectRatio(aspectRatio);
  const cardAspectRatio = mediaAspectRatio * IMAGE_HEIGHT_PERCENTAGE;
  const { ref, focused } = useFocusable({
    onEnterPress: action,
    focusKey: customKey,
  });

  useEffect(() => {
    if (focused && onFocus) onFocus();
  }, [focused, onFocus]);

  return (
    <FlexBox
      ref={ref}
      onClick={() => {
        if (customKey) setFocus(customKey);
        if (focused) action();
      }}
      direction="column"
      width={width}
      className={`shrink-0 overflow-hidden`}
      css={{
        flex: width ? `0 0 ${width}` : undefined,
        maxWidth: width,
        aspectRatio: `${cardAspectRatio}`,
      }}
    >
      <div className="h-[90%] w-full overflow-hidden rounded-md">
        <Image
          url={imgSrc}
          height="100%"
          width="100%"
          className={`h-full w-full rounded-md scale-90 border-2 border-transparent ${focused ? 'transform scale-100 transition-all duration-100 border-white' : ''}`}
          aspectRatio="auto"
        />
      </div>
      <div className="flex h-[10%] min-h-0 w-full flex-col justify-center overflow-hidden pt-1">
        {title && <span className="truncate text-sm leading-tight">{title}</span>}
        {subtitle && (
          <span className="truncate text-xs leading-tight text-white/70">{subtitle}</span>
        )}
      </div>
    </FlexBox>
  );
}

export default ContentCard;
