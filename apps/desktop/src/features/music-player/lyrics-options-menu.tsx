import { setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { Check, ChevronRight } from 'lucide-react';
import { memo, useEffect } from 'react';
import NavigationContainer from '@/components/navigation/NavigationContainer';
import { Button } from '@/components/ui/button';
import FlexBox from '@/components/ui/FlexBox';

interface LyricsOptionsMenuProps {
  open: boolean;
  triggerFocusKey: string;
  pronunciationLabel: string;
  translationLabel: string;
  hasPronunciation: boolean;
  showPronunciation: boolean;
  hasTranslation: boolean;
  showTranslation: boolean;
  onTogglePronunciation: () => void;
  onToggleTranslation: () => void;
  onClose: () => void;
}

interface LyricsOptionsItemProps {
  focusKey: string;
  label: string;
  value?: string;
  disabled?: boolean;
  selected?: boolean;
  showChevron?: boolean;
  onSelect?: () => void;
  onArrowPress?: (direction: string) => boolean | undefined;
}

function LyricsOptionsItem({
  focusKey,
  label,
  value,
  disabled = false,
  selected = false,
  showChevron = false,
  onSelect,
  onArrowPress,
}: LyricsOptionsItemProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: disabled ? undefined : onSelect,
    onArrowPress: disabled ? undefined : onArrowPress,
  });

  if (disabled) {
    return (
      <div className="flex w-full items-center justify-between rounded-[1.8vh] px-[1.8vh] py-[1.4vh] text-left opacity-40">
        <span className="text-[1.85vh] font-medium text-white/80">{label}</span>
        <div className="flex items-center gap-[0.8vh]">
          {value && <span className="text-[1.55vh] text-white/60">{value}</span>}
          {showChevron && <ChevronRight size={18} className="text-white/45" />}
        </div>
      </div>
    );
  }

  return (
    <Button
      ref={ref}
      size={null}
      variant="ghost"
      className={`flex w-full items-center justify-between rounded-[1.8vh] px-[1.8vh] py-[1.4vh] text-left transition-colors ${
        focused ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10'
      }`}
      onClick={onSelect}
    >
      <span className={`text-[1.85vh] font-medium ${focused ? 'text-black' : 'text-white/90'}`}>
        {label}
      </span>
      <div className="flex items-center gap-[0.8vh]">
        {value && (
          <span className={`text-[1.55vh] ${focused ? 'text-black/70' : 'text-white/60'}`}>
            {value}
          </span>
        )}
        {selected && !showChevron && (
          <Check size={18} className={focused ? 'text-black' : 'text-white'} />
        )}
        {showChevron && (
          <ChevronRight size={18} className={focused ? 'text-black/70' : 'text-white/55'} />
        )}
      </div>
    </Button>
  );
}

function LyricsOptionsMenu({
  open,
  triggerFocusKey,
  pronunciationLabel,
  translationLabel,
  hasPronunciation,
  showPronunciation,
  hasTranslation,
  showTranslation,
  onTogglePronunciation,
  onToggleTranslation,
  onClose,
}: LyricsOptionsMenuProps) {
  const pronunciationFocusKey = `${triggerFocusKey}-pronunciation`;
  const translationFocusKey = `${triggerFocusKey}-translation`;

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstFocusKey = hasPronunciation
      ? pronunciationFocusKey
      : hasTranslation
        ? translationFocusKey
        : null;

    if (!firstFocusKey) {
      return;
    }

    const focusTimeout = window.setTimeout(() => {
      setFocus(firstFocusKey);
    }, 30);

    return () => {
      window.clearTimeout(focusTimeout);
    };
  }, [hasPronunciation, hasTranslation, open, pronunciationFocusKey, translationFocusKey]);

  return (
    <NavigationContainer
      isFocusBoundary
      focusBoundaryDirections={['up', 'down', 'left', 'right']}
      className="w-[34vh] rounded-[2.6vh] border border-white/15 bg-black/80 p-[1vh] shadow-[0_2vh_6vh_rgba(0,0,0,0.45)] backdrop-blur-xl"
    >
      <FlexBox direction="column" gap={0.4} width="100%">
        <LyricsOptionsItem
          focusKey={pronunciationFocusKey}
          label={pronunciationLabel}
          disabled={!hasPronunciation}
          selected={showPronunciation}
          onSelect={() => {
            onTogglePronunciation();
            onClose();
          }}
          onArrowPress={(direction) => {
            if (direction === 'left') {
              onClose();
              return false;
            }

            return true;
          }}
        />

        <LyricsOptionsItem
          focusKey={translationFocusKey}
          label={translationLabel}
          disabled={!hasTranslation}
          selected={showTranslation}
          onSelect={() => {
            onToggleTranslation();
            onClose();
          }}
          onArrowPress={(direction) => {
            if (direction === 'left') {
              onClose();
              return false;
            }

            return true;
          }}
        />
      </FlexBox>
    </NavigationContainer>
  );
}

export default memo(LyricsOptionsMenu);
