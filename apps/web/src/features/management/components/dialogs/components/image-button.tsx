import { ImageType } from '@/shared/lib/constants';
import Image from '../../../../../shared/ui/image';

const SELECTED_IMAGE_STYLE = {
  borderColor: 'var(--app-color)',
  boxShadow: '0 10px 15px -3px rgba(142, 220, 230, 0.3), 0 4px 6px -2px rgba(142, 220, 230, 0.05)',
};

function getImageUrl(image: string, isLocal: boolean) {
  if (image.startsWith('http')) {
    return image;
  }

  if (isLocal) {
    return `/api/${image}`;
  }

  return `https://image.tmdb.org/t/p/original/${image}`;
}

function getImageDimensions(type: ImageType) {
  const width = type === ImageType.POSTER ? 60 : 90;

  if (type === ImageType.POSTER || type === ImageType.SQUARE) {
    return { width, height: 90 };
  }

  if (type === ImageType.BACKDROP) {
    return { width, height: 50 };
  }

  return { width, height: 40 };
}

function getAspectRatio(type: ImageType) {
  if (type === ImageType.POSTER) {
    return 2 / 3;
  }

  if (type === ImageType.BACKDROP) {
    return 16 / 9;
  }

  if (type === ImageType.SQUARE) {
    return 1;
  }

  return 3 / 1;
}

function getButtonClassName(isSelected: boolean, width: number, height: number) {
  const selectionClass = isSelected
    ? 'border-2 shadow-lg'
    : 'border-2 border-transparent hover:border-gray-300';

  return `relative cursor-pointer overflow-hidden rounded-lg transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-black/20 ${selectionClass} w-${width} h-${height}`;
}

interface ImageButtonProps {
  image: string;
  type: ImageType;
  selectedImage: string;
  isLocal?: boolean;
  selectImage: (image: string) => void;
}

function ImageButton({
  image,
  type = ImageType.BACKDROP,
  selectedImage,
  isLocal = false,
  selectImage,
}: ImageButtonProps) {
  const imageUrl = getImageUrl(image, isLocal);

  const isSelected = imageUrl === selectedImage;
  const { width, height } = getImageDimensions(type);
  const aspectRatio = getAspectRatio(type);

  return (
    <button
      type="button"
      className={getButtonClassName(isSelected, width, height)}
      style={isSelected ? SELECTED_IMAGE_STYLE : undefined}
      onClick={() => selectImage(imageUrl)}
    >
      {/* Checkmark overlay for selected image */}
      {isSelected && (
        <div
          className="absolute top-0 right-0 z-10 flex h-6 w-6 items-center justify-center rounded-bl-lg"
          style={{ backgroundColor: 'var(--app-color', color: 'black' }}
        >
          <svg className="h-4 w-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>Checkmark</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <Image
        key={image}
        src={imageUrl}
        fallbackSrc={
          type === ImageType.POSTER ? '/img/fileNotFound.jpg' : '/img/Default_video_thumbnail.jpg'
        }
        alt={image}
        aspectRatio={aspectRatio}
        objectFit="contain"
        width={width}
        height={height}
      />
    </button>
  );
}

export default ImageButton;
