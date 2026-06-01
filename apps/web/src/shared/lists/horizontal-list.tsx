import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Button } from '@/shared/ui/button';
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/shared/ui/carousel';
import FlexBox from '@/shared/ui/flex-box';

interface HorizontalListProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

function HorizontalList({ title, className, children }: HorizontalListProps) {
  const childrenCount = React.Children.count(children);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const [showButtons, setShowButtons] = useState(false);
  const [disableLeft, setDisableLeft] = useState(true);
  const [disableRight, setDisableRight] = useState(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!carouselApi) return;

    const updateButtonState = () => {
      const canScrollPrev = carouselApi.canScrollPrev();
      const canScrollNext = carouselApi.canScrollNext();
      const needsButtons = canScrollPrev || canScrollNext;

      setShowButtons(needsButtons);
      setDisableLeft(!canScrollPrev);
      setDisableRight(!canScrollNext);
    };

    if (childrenCount === 0) {
      setShowButtons(false);
      setDisableLeft(true);
      setDisableRight(true);
      return;
    }

    // Reinitialize when slides are added or removed.
    carouselApi.reInit();
    updateButtonState();

    carouselApi.on('select', updateButtonState);
    carouselApi.on('reInit', updateButtonState);

    return () => {
      carouselApi.off('select', updateButtonState);
      carouselApi.off('reInit', updateButtonState);
    };
  }, [carouselApi, childrenCount]);

  const handleScrollRight = () => {
    if (!carouselApi) return;
    carouselApi.scrollNext();
  };

  const handleScrollLeft = () => {
    if (!carouselApi) return;
    carouselApi.scrollPrev();
  };

  const gapValue = isMobile ? 1.5 : 0.5;
  const paddingValue = '1rem';

  return (
    <FlexBox
      direction="column"
      gap={gapValue}
      width={'100%'}
      className={className}
      padding={isMobile ? '0 1rem' : ''}
    >
      <FlexBox
        justify="space-between"
        align="center"
        width={'100%'}
        padding={`0 ${paddingValue}`}
        height={'3rem'}
      >
        <span className={`text-${isMobile ? 'xl' : '2xl'} font-semibold`}>{title}</span>
        {showButtons && (
          <FlexBox>
            <Button
              variant={'ghost'}
              onClick={handleScrollLeft}
              disabled={disableLeft}
              aria-label="Scroll Left"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant={'ghost'}
              onClick={handleScrollRight}
              disabled={disableRight}
              aria-label="Scroll Right"
            >
              <ChevronRight />
            </Button>
          </FlexBox>
        )}
      </FlexBox>
      <Carousel
        opts={{
          align: 'start',
          dragFree: true,
          containScroll: 'trimSnaps',
        }}
        setApi={setCarouselApi}
      >
        <CarouselContent
          className="ml-0"
          style={{
            gap: `${gapValue}rem`,
            padding: `0 ${paddingValue}`,
            width: '100%',
          }}
        >
          {React.Children.map(children, (child) => (
            <CarouselItem className="basis-auto pl-0">{child}</CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </FlexBox>
  );
}

export default HorizontalList;
