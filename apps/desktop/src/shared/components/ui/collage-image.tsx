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
const ioCallbacks = new Map<Element, (inView: boolean) => void>();
let sharedIO: IntersectionObserver | null = null;

function getSharedIO(): IntersectionObserver {
  if (!sharedIO) {
    sharedIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const callback = ioCallbacks.get(entry.target);
          if (callback) {
            callback(entry.isIntersecting);
          }
        }
      },
      { rootMargin: '300px', threshold: 0 }, // preload before visible
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
    ioCallbacks.set(el, setInView);
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

type UrlsRef = React.RefObject<(string | undefined)[]>;
type BlobsRef = React.RefObject<(Blob | undefined)[]>;
type SetUrls = React.Dispatch<React.SetStateAction<(string | undefined)[]>>;

const EMPTY_URLS: (string | undefined)[] = [undefined, undefined, undefined, undefined];
const COLLAGE_SLOTS = [
  { id: 'slot-0', index: 0 },
  { id: 'slot-1', index: 1 },
  { id: 'slot-2', index: 2 },
  { id: 'slot-3', index: 3 },
] as const;

function freeAllSlots(urlsRef: UrlsRef, prevBlobsRef: BlobsRef, setObjectUrls: SetUrls): void {
  let freed = false;
  for (let i = 0; i < 4; i++) {
    const url = urlsRef.current[i];
    if (url) {
      URL.revokeObjectURL(url);
      urlsRef.current[i] = undefined;
      prevBlobsRef.current[i] = undefined;
      freed = true;
    }
  }
  if (freed) setObjectUrls(EMPTY_URLS);
}

function syncBlobUrls(
  incoming: (Blob | undefined)[],
  urlsRef: UrlsRef,
  prevBlobsRef: BlobsRef,
  setObjectUrls: SetUrls,
): void {
  let changed = false;
  for (let i = 0; i < 4; i++) {
    const blob = incoming[i];
    if (blob !== prevBlobsRef.current[i]) {
      const prev = urlsRef.current[i];
      if (prev) URL.revokeObjectURL(prev);
      urlsRef.current[i] = blob ? URL.createObjectURL(blob) : undefined;
      prevBlobsRef.current[i] = blob;
      changed = true;
    }
  }
  if (changed) startTransition(() => setObjectUrls([...urlsRef.current]));
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
    if (!isInView) {
      freeAllSlots(urlsRef, prevBlobsRef, setObjectUrls);
      return;
    }
    syncBlobUrls([blob0, blob1, blob2, blob3], urlsRef, prevBlobsRef, setObjectUrls);
  }, [blob0, blob1, blob2, blob3, isInView]);

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
      {COLLAGE_SLOTS.map((slot) => {
        const img = slots[slot.index];
        const src =
          objectUrls[slot.index] ?? (img?.startsWith('http') ? img : undefined) ?? defaultSrc;
        return (
          <img
            key={slot.id}
            src={isInView ? src : undefined}
            alt=""
            className="h-full w-full object-cover"
          />
        );
      })}
    </div>
  );
}

// Custom equality: avoid re-renders when parent passes a new array with identical values.
export default memo(
  CollageImage,
  (prev, next) =>
    prev.defaultSrc === next.defaultSrc &&
    prev.className === next.className &&
    prev.images.length === next.images.length &&
    prev.images.every((img, i) => img === next.images[i]),
);
