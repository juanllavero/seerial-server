import { setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { useEffect } from 'react';
import FlexBox from './ui/FlexBox';
import Image from './ui/Image';

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
  height = 'auto',
  width = 'auto',
  title,
  subtitle,
  action,
  onFocus,
  customKey,
}: CardProps) {
  const { ref, focused } = useFocusable({
    onEnterPress: action,
    focusKey: customKey,
  });

  useEffect(() => {
    if (focused && onFocus) onFocus();
  }, [focused]);

  return (
    <FlexBox
      ref={ref}
      onClick={() => {
        if (customKey) setFocus(customKey);
        if (focused) action();
      }}
      direction="column"
      width={width}
      className={`${focused ? 'transform scale-105 transition-all duration-200' : ''}`}
    >
      <Image
        url={imgSrc}
        height={height}
        width={width}
        className="rounded-md"
        aspectRatio={aspectRatio}
      />
      {title && <span className="truncate">{title}</span>}
      {subtitle && <span className="truncate">{subtitle}</span>}
    </FlexBox>
  );
}

export default ContentCard;
