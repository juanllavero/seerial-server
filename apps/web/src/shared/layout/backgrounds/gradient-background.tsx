import { useGetImageColors } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { useEffect, useRef, useState } from 'react';

interface GradientBackgroundProps {
  showGradient?: boolean;
  imageSrc?: string;
  width?: string;
  height?: string;
  index?: number;
}

interface ImageColorsResponse {
  css?: string;
  data?: {
    css?: string;
  };
}

const GRADIENT_TRANSITION_MS = 700;
// How long to wait after a source change before starting the crossfade.
// Prevents the gradient from updating while quickly navigating between cards.
const GRADIENT_DELAY_MS = 400;

const normalizeGradientCss = (value?: string): string => {
  if (!value) return '';
  return value
    .replace(/^background\s*:\s*/i, '')
    .replace(/;$/, '')
    .trim();
};

const getImageColorsSourceKey = (params?: { url?: string; localPath?: string }): string => {
  if (params?.url) return `url:${params.url}`;
  if (params?.localPath) return `local:${params.localPath}`;
  return '';
};

const buildImageColorsParams = (
  imageSrc?: string,
): { url?: string; localPath?: string } | undefined => {
  if (!imageSrc || imageSrc === '') return undefined;
  if (imageSrc.startsWith('http')) return { url: imageSrc };
  if (imageSrc.startsWith('local')) return { localPath: imageSrc.replace('local', '') };
  return { localPath: imageSrc };
};

const GradientBackground = ({
  showGradient = true,
  imageSrc,
  width = '100%',
  height = '100%',
  index = -1,
}: GradientBackgroundProps) => {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');

  // Layer A: committed gradient, always visible as the base
  const [committedGradient, setCommittedGradient] = useState('');
  // Layer B: incoming gradient, fades in on top of A
  const [incomingGradient, setIncomingGradient] = useState('');
  const [incomingVisible, setIncomingVisible] = useState(false);

  const gradientCacheRef = useRef<Record<string, string>>({});
  const rafRef = useRef<number | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const imageColorsParams = buildImageColorsParams(imageSrc);
  const imageSourceKey = getImageColorsSourceKey(imageColorsParams);

  const { data: imageColorsData } = useGetImageColors<ImageColorsResponse>({
    enabled: showGradient && !!imageColorsParams,
    params: imageColorsParams,
    queryKey: ['images', 'colors', serverUrl, imageSrc],
    staleTime: 1000 * 60 * 30,
  });

  const imageColorsCss = normalizeGradientCss(imageColorsData?.css ?? imageColorsData?.data?.css);

  useEffect(() => {
    const cancelPendingRaf = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const cancelPendingDelay = () => {
      if (delayTimerRef.current !== null) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    };

    const crossfadeTo = (gradient: string) => {
      cancelPendingRaf();
      setIncomingGradient(gradient);
      setIncomingVisible(false);

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setIncomingVisible(true);
          rafRef.current = null;
        });
      });
    };

    const scheduleCrossfade = (gradient: string) => {
      cancelPendingDelay();
      cancelPendingRaf();

      delayTimerRef.current = setTimeout(() => {
        delayTimerRef.current = null;
        crossfadeTo(gradient);
      }, GRADIENT_DELAY_MS);
    };

    // No valid source or gradients disabled: leave the current background untouched.
    // Satisfies req: invalid/undefined/empty imageSrc → keep existing gradient.
    if (!showGradient || !imageSourceKey) return;

    // Prefer fresh server data; fall back to local cache for this source key.
    // If neither exists (fetch in-flight or failed), bail out without changes.
    const resolvedGradient = imageColorsCss || gradientCacheRef.current[imageSourceKey];
    if (!resolvedGradient) return;

    // Update cache with the fresh value
    if (imageColorsCss) {
      gradientCacheRef.current[imageSourceKey] = imageColorsCss;
    }

    // Nothing changed, cancel any pending transition
    if (resolvedGradient === committedGradient) {
      cancelPendingDelay();
      cancelPendingRaf();
      return;
    }

    // First gradient ever: apply immediately, no animation needed
    if (!committedGradient) {
      cancelPendingDelay();
      cancelPendingRaf();
      setCommittedGradient(resolvedGradient);
      return;
    }

    // Different gradient: schedule a delayed crossfade
    scheduleCrossfade(resolvedGradient);

    return () => {
      cancelPendingDelay();
      cancelPendingRaf();
    };
  }, [showGradient, imageSourceKey, imageColorsCss, committedGradient]);

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== 'opacity' || !incomingVisible || !incomingGradient) {
      return;
    }
    // Commit the incoming gradient to layer A and reset layer B
    setCommittedGradient(incomingGradient);
    setIncomingGradient('');
    setIncomingVisible(false);
  };

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: index, width, height }}>
      {/* Layer A: committed gradient, permanent base */}
      <div
        className="absolute inset-0 h-full w-full"
        style={{ width, height, background: committedGradient }}
      />
      {/* Layer B: incoming gradient, fades in over layer A */}
      <div
        className="absolute inset-0 h-full w-full"
        onTransitionEnd={handleTransitionEnd}
        style={{
          width,
          height,
          background: incomingGradient,
          opacity: incomingVisible ? 1 : 0,
          transition: `opacity ${GRADIENT_TRANSITION_MS}ms ease`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default GradientBackground;
