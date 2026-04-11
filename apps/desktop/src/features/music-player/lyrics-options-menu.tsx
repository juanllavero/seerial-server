import { setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import FlexBox from '@/components/ui/FlexBox';

interface TranslationOption {
  language: string;
  label: string;
}

interface LyricsOptionsMenuProps {
  open: boolean;
  triggerFocusKey: string;
  pronunciationLabel: string;
  translationLabel: string;
  offLabel: string;
  hasPronunciation: boolean;
  showPronunciation: boolean;
  translationOptions: TranslationOption[];
  selectedTranslationLanguage: string | null;
  onTogglePronunciation: () => void;
  onSelectTranslation: (language: string | null) => void;
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

function sanitizeFocusKey(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function LyricsOptionsMenu({
  open,
  triggerFocusKey,
  pronunciationLabel,
  translationLabel,
  offLabel,
  hasPronunciation,
  showPronunciation,
  translationOptions,
  selectedTranslationLanguage,
  onTogglePronunciation,
  onSelectTranslation,
  onClose,
}: LyricsOptionsMenuProps) {
  const [isTranslationListOpen, setIsTranslationListOpen] = useState(false);

  const pronunciationFocusKey = `${triggerFocusKey}-pronunciation`;
  const translationFocusKey = `${triggerFocusKey}-translation`;
  const translationOffFocusKey = `${triggerFocusKey}-translation-off`;
  const selectedTranslationLabel =
    translationOptions.find((option) => option.language === selectedTranslationLanguage)?.label ??
    offLabel;

  useEffect(() => {
    if (!open) {
      setIsTranslationListOpen(false);
      return;
    }

    const firstFocusKey = hasPronunciation
      ? pronunciationFocusKey
      : translationOptions.length > 0
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
  }, [
    hasPronunciation,
    open,
    pronunciationFocusKey,
    translationFocusKey,
    translationOptions.length,
  ]);

  useEffect(() => {
    if (!isTranslationListOpen) {
      return;
    }

    const focusTimeout = window.setTimeout(() => {
      setFocus(
        selectedTranslationLanguage
          ? `${triggerFocusKey}-translation-${sanitizeFocusKey(selectedTranslationLanguage)}`
          : translationOffFocusKey,
      );
    }, 30);

    return () => {
      window.clearTimeout(focusTimeout);
    };
  }, [isTranslationListOpen, selectedTranslationLanguage, translationOffFocusKey, triggerFocusKey]);

  useEffect(() => {
    if (translationOptions.length === 0) {
      setIsTranslationListOpen(false);
    }
  }, [translationOptions.length]);

  return (
    <div className="w-[34vh] rounded-[2.6vh] border border-white/15 bg-black/80 p-[1vh] shadow-[0_2vh_6vh_rgba(0,0,0,0.45)] backdrop-blur-xl">
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
          value={selectedTranslationLabel}
          disabled={translationOptions.length === 0}
          showChevron
          onSelect={() => {
            if (translationOptions.length === 0) {
              return;
            }

            setIsTranslationListOpen(true);
          }}
          onArrowPress={(direction) => {
            if (direction === 'left') {
              onClose();
              return false;
            }

            if (direction === 'right') {
              setIsTranslationListOpen(true);
              return false;
            }

            return true;
          }}
        />

        <AnimatePresence initial={false}>
          {isTranslationListOpen && translationOptions.length > 0 && (
            <motion.div
              key="translation-options"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden rounded-[2vh] border border-white/10 bg-white/4 p-[0.6vh]"
            >
              <FlexBox direction="column" gap={0.35} width="100%">
                <LyricsOptionsItem
                  focusKey={translationOffFocusKey}
                  label={offLabel}
                  selected={selectedTranslationLanguage === null}
                  onSelect={() => {
                    onSelectTranslation(null);
                    onClose();
                  }}
                  onArrowPress={(direction) => {
                    if (direction === 'left') {
                      setIsTranslationListOpen(false);
                      window.setTimeout(() => setFocus(translationFocusKey), 30);
                      return false;
                    }

                    return true;
                  }}
                />

                {translationOptions.map((option) => {
                  const optionFocusKey = `${triggerFocusKey}-translation-${sanitizeFocusKey(option.language)}`;

                  return (
                    <LyricsOptionsItem
                      key={option.language}
                      focusKey={optionFocusKey}
                      label={option.label}
                      selected={selectedTranslationLanguage === option.language}
                      onSelect={() => {
                        onSelectTranslation(option.language);
                        onClose();
                      }}
                      onArrowPress={(direction) => {
                        if (direction === 'left') {
                          setIsTranslationListOpen(false);
                          window.setTimeout(() => setFocus(translationFocusKey), 30);
                          return false;
                        }

                        return true;
                      }}
                    />
                  );
                })}
              </FlexBox>
            </motion.div>
          )}
        </AnimatePresence>
      </FlexBox>
    </div>
  );
}

export default memo(LyricsOptionsMenu);
