import { useGetLocalImage } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { useEffect, useRef, useState } from 'react';

export const useResolveImageUrl = (url?: string, isInView: boolean = true) => {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const objectUrlRef = useRef<string | null>(null);

  const isRemoteUrl = !!url?.startsWith('http');
  const localImagePath = url && !isRemoteUrl ? url : undefined;

  // Initialize with the URL if it's remote, otherwise undefined until we get the blob
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(isRemoteUrl ? url : undefined);

  const { data: localImageBlob, error: localImageError } = useGetLocalImage({
    enabled: isInView && !!localImagePath && !!serverUrl,
    params: localImagePath ? { path: localImagePath } : undefined,
    queryKey: ['images', 'local', serverUrl, localImagePath],
  });

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    let nextResolvedUrl: string | undefined;

    if (isRemoteUrl || !url) {
      nextResolvedUrl = isRemoteUrl ? url : undefined;
    } else if (localImageBlob) {
      const objectUrl = URL.createObjectURL(localImageBlob);
      objectUrlRef.current = objectUrl;
      nextResolvedUrl = objectUrl;
    }

    setResolvedUrl(nextResolvedUrl);

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [localImageBlob, isRemoteUrl, url]);

  return {
    resolvedUrl,
    localImageError,
    isLocalImage: !isRemoteUrl && !!url,
  };
};
