import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationScrollView } from '@/shared/components/navigation';
import FlexBox from '@/shared/components/ui/flex-box';
import Image from '@/shared/components/ui/image';
import { useKeyboardBack } from '@/shared/hooks/use-keyboard-back';
import { NavigationFocusKeys } from '@/shared/navigation/constants';
import ListTitle from '../text/list-title';
import Subtitle from '../text/subtitle';
import Tertiary from '../text/tertiary';
import DetailsActionButtons from './details-action-buttons';
import DetailsCastCard from './details-cast-card';
import DetailsHeader from './details-header';
import type { DetailsInfoProps } from './details-info.types';
import DetailsSummary from './details-summary';
import DetailsTechnicalInfo from './details-technical-info';

function buildCastFocusKey(name: string, character: string, profileImage: string): string {
  const rawKey = `${name}-${character}-${profileImage}`;
  return `details-cast-${rawKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function DetailsInfo({
  details,
  subtitle,
  infoItems,
  durationInfo,
  timeWatchedInfo,
  customDescription,
  handlePlay,
  handleMoreOptions,
  handleMarkWatched,
  handleToggleHideThumbnails,
  videoInfo,
  audioInfo,
  subtitleInfo,
  displayOptions,
  behaviorOptions,
  cast,
  isExpandedImageLandscape = false,
  expandedImageSrc,
  expandedTitle,
  onDescriptionExpandedChange,
}: DetailsInfoProps) {
  const { isWatched, hideUnwatchedThumbnails, hideButtons } = displayOptions ?? {};
  const { enableKeyboardBack = true, disableInitialFocus = false } = behaviorOptions ?? {};

  const { t } = useTranslation();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [focusedCastId, setFocusedCastId] = useState<string | undefined>();
  const castMembers = cast ?? [];
  const descriptionText = customDescription || details?.description;
  const fullTitle = expandedTitle || subtitle || details?.title;
  const firstCastFocusKey = useMemo(
    () =>
      castMembers.length > 0
        ? buildCastFocusKey(
            castMembers[0]?.name ?? '',
            castMembers[0]?.character ?? '',
            castMembers[0]?.profileImage ?? '',
          )
        : undefined,
    [castMembers],
  );

  const closeExpandedDescription = useCallback(() => {
    setIsDescriptionExpanded(false);
    onDescriptionExpandedChange?.(false);

    requestAnimationFrame(() => {
      setFocus(NavigationFocusKeys.details.descriptionButton);
    });
  }, [onDescriptionExpandedChange]);

  const openExpandedDescription = useCallback(() => {
    if (!descriptionText) {
      return;
    }

    setIsDescriptionExpanded(true);
    onDescriptionExpandedChange?.(true);
  }, [descriptionText, onDescriptionExpandedChange]);

  useKeyboardBack({
    enabled: enableKeyboardBack,
    navigateOnBack: !isDescriptionExpanded,
    preAction: isDescriptionExpanded ? closeExpandedDescription : undefined,
    capture: isDescriptionExpanded,
    stopPropagation: isDescriptionExpanded,
  });

  useEffect(() => {
    if (disableInitialFocus) {
      return;
    }

    if (isDescriptionExpanded) {
      return;
    }

    setFocus(NavigationFocusKeys.details.playButton);
  }, [disableInitialFocus, isDescriptionExpanded]);

  useEffect(() => {
    if (!isDescriptionExpanded || !firstCastFocusKey) {
      return;
    }

    setFocusedCastId(firstCastFocusKey);

    const frame = window.requestAnimationFrame(() => {
      setFocus(firstCastFocusKey);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
    // Avoid calling prop callback in effect; instead, call directly in the handler where state changes
    // If you need to synchronize, lift state up to a shared Provider or use a shared state management
    // Remove prop callback call from effect
  }, [isDescriptionExpanded, firstCastFocusKey]);

  if (isDescriptionExpanded) {
    return (
      <FlexBox
        direction="column"
        justify="space-between"
        width="100dvw"
        height="100dvh"
        padding="4dvh 0 0 0"
        className="absolute z-50 top-0"
      >
        <FlexBox align="start" height={'100%'} gap={5} padding="0 5dvh">
          <FlexBox
            className="shrink-0 overflow-hidden rounded-xl bg-black/35"
            css={{
              height: isExpandedImageLandscape ? '44dvh' : '58dvh',
              width: 'auto',
              aspectRatio: isExpandedImageLandscape ? '16 / 9' : '3 / 4',
            }}
          >
            <Image
              url={expandedImageSrc}
              fallbackSrc="/img/fileNotFound.jpg"
              alt={fullTitle}
              width="100%"
              height="100%"
              objectFit="cover"
            />
          </FlexBox>

          <FlexBox direction="column" gap={1.2} css={{ minWidth: 0 }}>
            {!!fullTitle && <Subtitle className="line-clamp-2">{fullTitle}</Subtitle>}
            <Tertiary
              className="overflow-y-auto pr-2"
              style={{ color: 'var(--text-secondary)', maxHeight: '40dvh' }}
            >
              {descriptionText}
            </Tertiary>
          </FlexBox>
        </FlexBox>

        {castMembers.length > 0 && (
          <FlexBox direction="column" gap={1.2} height={'35dvh'}>
            <ListTitle style={{ color: 'var(--text-primary)' }}>{t('cast')}</ListTitle>
            <NavigationScrollView
              direction="horizontal"
              className="w-full gap-4 pb-[2dvh]"
              scrollMode="center"
              focusedElementId={focusedCastId}
              isRestoringFocus={false}
            >
              {castMembers.map((person) => {
                const focusKey = buildCastFocusKey(
                  person.name,
                  person.character,
                  person.profileImage,
                );

                return (
                  <DetailsCastCard
                    key={focusKey}
                    person={person}
                    focusKey={focusKey}
                    onFocused={setFocusedCastId}
                    isSelected={focusedCastId === focusKey}
                  />
                );
              })}
            </NavigationScrollView>
          </FlexBox>
        )}
      </FlexBox>
    );
  }

  return (
    <FlexBox direction="column" justify="end" width={'100%'} className="z-50" padding="0 4rem">
      <DetailsHeader details={details} subtitle={subtitle} />
      <DetailsSummary
        details={details}
        infoItems={infoItems}
        durationInfo={durationInfo}
        timeWatchedInfo={timeWatchedInfo}
        customDescription={customDescription}
        clickableDescription={!hideButtons}
        onDescriptionClick={openExpandedDescription}
      />

      {!hideButtons && (
        <FlexBox
          className="flex-row"
          width={'100%'}
          justify="space-between"
          align="center"
          css={{
            paddingTop: 50,
            gap: 10,
          }}
        >
          <DetailsActionButtons
            handlePlay={handlePlay}
            handleMoreOptions={handleMoreOptions}
            handleMarkWatched={handleMarkWatched}
            handleToggleHideThumbnails={handleToggleHideThumbnails}
            timeWatchedInfo={timeWatchedInfo}
            isWatched={isWatched}
            hideUnwatchedThumbnails={hideUnwatchedThumbnails}
          />
          <DetailsTechnicalInfo
            videoInfo={videoInfo}
            audioInfo={audioInfo}
            subtitleInfo={subtitleInfo}
          />
        </FlexBox>
      )}
    </FlexBox>
  );
}

export default DetailsInfo;
