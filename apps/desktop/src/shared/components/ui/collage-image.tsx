import { useGetLocalImage } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { memo, startTransition, useEffect, useRef, useState } from 'react';

interface CollageImageProps {
  images: string[];
  defaultSrc: string;
  className?: string;
}

// ─── Shared IntersectionObserver ────────────────────────────────────────────
// One observer for the entire app instead of one per card.
const ioCallbacks = new Map<Element, () => void>();
let sharedIO: IntersectionObserver | null = null;

function getSharedIO(): IntersectionObserver {
  if (!sharedIO) {
    sharedIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            ioCallbacks.get(entry.target)?.();
            ioCallbacks.delete(entry.target);
            sharedIO!.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }, // preload before visible
    );
  }
  return sharedIO;
}

function useInView(ref: React.RefObject<HTMLDivElement | null>): boolean {
  const [inView, setInView] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: <ref.crrent is not neccessary>
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = getSharedIO();
    ioCallbacks.set(el, () => setInView(true));
    io.observe(el);
    return () => {
      ioCallbacks.delete(el);
      io.unobserve(el);
    };
  }, []); // ref is stable
  return inView;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toLocalPath(url: string | undefined): string | undefined {
  return url && !url.startsWith('http') ? url : undefined;
}

// ─── Component ───────────────────────────────────────────────────────────────
function CollageImage({ images, defaultSrc, className = '' }: CollageImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef);
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');

  const p0 = toLocalPath(images[0]);
  const p1 = toLocalPath(images[1]);
  const p2 = toLocalPath(images[2]);
  const p3 = toLocalPath(images[3]);

  const { data: blob0 } = useGetLocalImage({
    enabled: isInView && !!p0 && !!serverUrl,
    params: p0 ? { path: p0 } : undefined,
    queryKey: ['images', 'local', serverUrl, p0],
  });
  const { data: blob1 } = useGetLocalImage({
    enabled: isInView && !!p1 && !!serverUrl,
    params: p1 ? { path: p1 } : undefined,
    queryKey: ['images', 'local', serverUrl, p1],
  });
  const { data: blob2 } = useGetLocalImage({
    enabled: isInView && !!p2 && !!serverUrl,
    params: p2 ? { path: p2 } : undefined,
    queryKey: ['images', 'local', serverUrl, p2],
  });
  const { data: blob3 } = useGetLocalImage({
    enabled: isInView && !!p3 && !!serverUrl,
    params: p3 ? { path: p3 } : undefined,
    queryKey: ['images', 'local', serverUrl, p3],
  });

  // ── Per-slot object URL tracking ──────────────────────────────────────────
  // Avoids revoking + recreating all 4 URLs when only one blob changes.
  const urlsRef = useRef<(string | undefined)[]>([undefined, undefined, undefined, undefined]);
  const prevBlobsRef = useRef<(Blob | undefined)[]>([undefined, undefined, undefined, undefined]);
  const [objectUrls, setObjectUrls] = useState<(string | undefined)[]>([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);

  useEffect(() => {
    const incoming = [blob0, blob1, blob2, blob3];
    let changed = false;

    for (let i = 0; i < 4; i++) {
      if (incoming[i] !== prevBlobsRef.current[i]) {
        if (urlsRef.current[i]) URL.revokeObjectURL(urlsRef.current[i]!);
        urlsRef.current[i] = incoming[i] ? URL.createObjectURL(incoming[i]!) : undefined;
        prevBlobsRef.current[i] = incoming[i];
        changed = true;
      }
    }

    if (changed) startTransition(() => setObjectUrls([...urlsRef.current]));
  }, [blob0, blob1, blob2, blob3]);

  // Revoke all on unmount.
  useEffect(
    () => () => {
      for (const url of urlsRef.current) if (url) URL.revokeObjectURL(url);
    },
    [],
  );

  const slots = [images[0], images[1], images[2], images[3]];

  return (
    <div
      ref={containerRef}
      className={`grid h-full w-full grid-cols-2 grid-rows-2 overflow-hidden ${className}`}
    >
      {slots.map((img, i) => {
        const src = objectUrls[i] ?? (img?.startsWith('http') ? img : undefined) ?? defaultSrc;
        return (
          <img
            // biome-ignore lint/suspicious/noArrayIndexKey: positional slots
            key={i}
            src={isInView ? src : undefined}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        );
      })}
    </div>
  );
}

// Custom equality: evita re-renders cuando el padre pasa un array nuevo con los mismos valores.
export default memo(
  CollageImage,
  (prev, next) =>
    prev.defaultSrc === next.defaultSrc &&
    prev.className === next.className &&
    prev.images.length === next.images.length &&
    prev.images.every((img, i) => img === next.images[i]),
);
