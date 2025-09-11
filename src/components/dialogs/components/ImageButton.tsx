import { useServerStore } from '@/context/server.context'
import Image from '../../ui/Image'

interface ImageButtonProps {
  image: string
  isPoster: boolean
  selectedImage: string
  isLocal?: boolean
  selectImage: (image: string) => void
}

function ImageButton({
  image,
  isPoster,
  selectedImage,
  isLocal = false,
  selectImage,
}: ImageButtonProps) {
  const serverUrl = useServerStore((state) => state.serverUrl)
  const imageUrl = image.startsWith('http')
    ? image
    : isLocal
      ? `${serverUrl}/${image}`
      : `https://image.tmdb.org/t/p/original/${image}`

  const isSelected = imageUrl === selectedImage

  return (
    <div
      className={`relative cursor-pointer overflow-hidden rounded-lg transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-black/20 ${
        isSelected
          ? 'border-2 shadow-lg'
          : 'border-2 border-transparent hover:border-gray-300'
      } w-${isPoster ? 60 : 90} h-${isPoster ? 90 : 40}`}
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
          isPoster
            ? '/img/fileNotFound.jpg'
            : '/img/Default_video_thumbnail.jpg'
        }
        alt={image}
        aspectRatio={isPoster ? 2 / 3 : 16 / 9}
        width={isPoster ? 60 : 90}
      />
    </div>
  )
}

export default ImageButton
