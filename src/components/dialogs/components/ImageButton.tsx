import { ImageType } from '@/utils/constants'
import Image from '../../ui/Image'

interface ImageButtonProps {
  image: string
  type: ImageType
  selectedImage: string
  isLocal?: boolean
  selectImage: (image: string) => void
}

function ImageButton({
  image,
  type = ImageType.BACKDROP,
  selectedImage,
  isLocal = false,
  selectImage,
}: ImageButtonProps) {
  const imageUrl = image.startsWith('http')
    ? image
    : isLocal
      ? `/api/${image}`
      : `https://image.tmdb.org/t/p/original/${image}`

  const isSelected = imageUrl === selectedImage

  const width = type === ImageType.POSTER ? 60 : 90
  const height =
    type === ImageType.POSTER || type === ImageType.SQUARE
      ? 90
      : type === ImageType.BACKDROP
        ? 50
        : 40

  return (
    <div
      className={`relative cursor-pointer overflow-hidden rounded-lg transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-black/20 ${
        isSelected
          ? 'border-2 shadow-lg'
          : 'border-2 border-transparent hover:border-gray-300'
      } w-${width} h-${height}`}
      style={
        isSelected
          ? {
              borderColor: 'var(--app-color)',
              boxShadow:
                '0 10px 15px -3px rgba(142, 220, 230, 0.3), 0 4px 6px -2px rgba(142, 220, 230, 0.05)',
            }
          : {}
      }
      onClick={() => selectImage(imageUrl)}
    >
      {/* Checkmark overlay for selected image */}
      {isSelected && (
        <div
          className="absolute top-0 right-0 z-10 flex h-6 w-6 items-center justify-center rounded-bl-lg"
          style={{ backgroundColor: 'var(--app-color', color: 'black' }}
        >
          <svg
            className="h-4 w-4 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}

      <Image
        key={image}
        src={imageUrl}
        fallbackSrc={
          type === ImageType.POSTER
            ? '/img/fileNotFound.jpg'
            : '/img/Default_video_thumbnail.jpg'
        }
        alt={image}
        aspectRatio={
          type === ImageType.POSTER
            ? 2 / 3
            : type === ImageType.BACKDROP
              ? 16 / 9
              : type === ImageType.SQUARE
                ? 1
                : 3 / 1
        }
        objectFit="contain"
        width={width}
        height={height}
      />
    </div>
  )
}

export default ImageButton
