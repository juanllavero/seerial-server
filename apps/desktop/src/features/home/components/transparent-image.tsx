import { useGetTransparentImage } from '@seerial/api';
import { useServerStore } from '@seerial/stores';
import { useEffect, useState } from 'react';

interface TransparentImageProps {
  imageSrc: string;
}

const windowsPathRegex = /^[a-zA-Z]:[\\/]/;
const unixPathRegex = /^\//;

const isAbsolutePath = (value: string): boolean => {
  return windowsPathRegex.test(value) || unixPathRegex.test(value);
};

const normalizeRelativeImageUrl = (serverUrl: string, imageSrc: string): string => {
  const normalizedServerUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
  const normalizedImagePath = imageSrc.startsWith('/') ? imageSrc.slice(1) : imageSrc;

  return `${normalizedServerUrl}/${normalizedImagePath.replace('resources/img', 'img')}`;
};

const buildTransparentImageParams = (
  serverUrl: string,
  imageSrc: string,
  imageWidth: number,
  imageHeight: number,
):
  | {
      width: number;
      height: number;
      url?: string;
      localPath?: string;
    }
  | undefined => {
  if (!imageSrc) {
    return undefined;
  }

  const width = Math.round(imageWidth * 2);
  const height = Math.round(imageHeight * 2);

  if (imageSrc.startsWith('http')) {
    return { url: imageSrc, width, height };
  }

  if (imageSrc.startsWith('local')) {
    return { localPath: imageSrc.replace('local', ''), width, height };
  }

  if (isAbsolutePath(imageSrc)) {
    return { localPath: imageSrc, width, height };
  }

  if (!serverUrl) {
    return undefined;
  }

  return {
    url: normalizeRelativeImageUrl(serverUrl, imageSrc),
    width,
    height,
  };
};

function TransparentImage({ imageSrc }: TransparentImageProps) {
  const serverUrl = useServerStore((state) => state.selectedServer?.url ?? '');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const imageHeight = window.innerHeight * 0.8;
  const imageWidth = imageHeight * (16 / 9);
  const transparentImageParams = buildTransparentImageParams(
    serverUrl,
    imageSrc,
    imageWidth,
    imageHeight,
  );

  const { data: transparentImageBlob, error } = useGetTransparentImage({
    enabled: !!transparentImageParams,
    params: transparentImageParams,
    queryKey: [
      'images',
      'transparent',
      serverUrl,
      imageSrc,
      transparentImageParams?.width,
      transparentImageParams?.height,
    ],
  });

  useEffect(() => {
    if (!transparentImageBlob) {
      setImageDataUrl(null);
      return;
    }

    const dataUrl = URL.createObjectURL(transparentImageBlob);
    setImageDataUrl(dataUrl);

    return () => {
      URL.revokeObjectURL(dataUrl);
    };
  }, [transparentImageBlob]);

  return (
    <div className="absolute top-0 right-0 flex justify-end w-full h-full z-10 opacity-20 pointer-events-none">
      {error ? (
        <p>{error}</p>
      ) : imageDataUrl ? (
        <img
          src={imageDataUrl}
          alt="Selected Item Background"
          style={{
            height: imageHeight,
          }}
        />
      ) : null}
    </div>
  );
}

export default TransparentImage;
