import { useIsTablet } from '@/components/hooks/use-tablet'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { API, authenticatedFetch, authenticatedFetcher } from '@/config/api'
import { ImageType } from '@/utils/constants'
import { generateRandoumUUID, showToast } from '@/utils/ReactUtils'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR, { mutate } from 'swr'
import ImageButton from './ImageButton'

interface LocalImage {
  name: string
  url: string
}

interface ImageListTabProps {
  imagesList: string[]
  localFolder: string
  selectImage: (image: string) => void
  selectedImage: string
  type?: ImageType
}

function ImageListTab({
  imagesList,
  localFolder,
  selectImage,
  selectedImage,
  type = ImageType.BACKDROP,
}: ImageListTabProps) {
  const { t } = useTranslation()
  const [pastingUrl, setPastingUrl] = useState<boolean>(false)
  const [urlToDownload, setUrlToDownload] = useState<string>('')
  const isTablet = useIsTablet()

  // Upload image
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  // Reference to hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: localImages, isLoading } = useSWR<LocalImage[]>(
    localFolder ? `${API.images.directoryListing}?path=${localFolder}` : null,
    authenticatedFetcher,
  )

  const handleImageUpload = () => {
    setImageUrl(null)
    fileInputRef.current?.click()
  }

  // Handle file selection
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (file) {
      // Verify if the file is an image
      if (!file.type.startsWith('image/')) {
        showToast('error', t('invalidImageError'))
        return
      }

      // Create URL for preview
      const imageUrl = URL.createObjectURL(file)
      setImageUrl(imageUrl)

      // Send the image to the server
      await uploadImage(file)
    }

    // Clear the input after selection
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (file: File) => {
    setIsUploading(true)
    const formData = new FormData()
    formData.append('destPath', localFolder)
    formData.append('image', file)

    try {
      await authenticatedFetch(API.images.upload, 'POST', formData)

      mutate(`${API.images.directoryListing}?path=${localFolder}`)

      showToast('success', t('imageLoaded'))
    } catch (err) {
      showToast('error', t('errorImageUpload'))
    } finally {
      setIsUploading(false)
    }
  }

  const downloadImage = async (url: string) => {
    setIsUploading(true)

    try {
      await authenticatedFetch(API.downloads.image, 'POST', {
        url: url,
        downloadFolder: localFolder,
        fileName: `${generateRandoumUUID()}.${url.split('.').pop()}`,
      })

      mutate(`${API.images.directoryListing}?path=${localFolder}`)

      showToast('success', t('imageLoaded'))
    } catch (err) {
      showToast('error', t('errorImageUpload'))
    } finally {
      setIsUploading(false)
    }
  }

  // Clean up the object URL when the component unmounts
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  console.log({ localImages })

  return (
    <FlexBox direction="column" gap={1} height={isTablet ? '25rem' : '35rem'}>
      <FlexBox
        gap={1}
        justify="center"
        align="center"
        width={'100%'}
        padding="0 0.5rem"
      >
        {/* Hidden input for file selection */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {pastingUrl ? (
          <>
            <Input
              type="text"
              placeholder="Paste URL"
              value={urlToDownload}
              onChange={(e) => setUrlToDownload(e.target.value)}
            />
            <Button
              variant={'secondary'}
              onClick={() => {
                setPastingUrl(false)
                selectImage(urlToDownload)
              }}
            >
              {t('cancelButton')}
            </Button>
            <Button
              onClick={() => {
                setPastingUrl(false)
                downloadImage(urlToDownload)
              }}
            >
              {t('downloadButton')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleImageUpload} disabled={isUploading}>
              {t('loadImageButton')}
            </Button>
            <Button onClick={() => setPastingUrl(true)} disabled={isUploading}>
              {t('fromURLButton')}
            </Button>
          </>
        )}
      </FlexBox>

      <FlexBox
        gap={1}
        direction="row"
        wrap="wrap"
        scroll="vertical"
        justify="stretch"
        hideScrollbar={isTablet}
        padding="0 1rem"
      >
        {imagesList &&
          imagesList.map((image) => (
            <ImageButton
              key={image}
              image={image}
              type={type}
              selectedImage={selectedImage}
              selectImage={selectImage}
            />
          ))}

        {!isLoading &&
          localImages &&
          localImages.map((image: { name: string; url: string }) => (
            <ImageButton
              key={image.name + ' ' + image.url}
              image={image.url}
              type={type}
              isLocal
              selectedImage={selectedImage}
              selectImage={selectImage}
            />
          ))}
      </FlexBox>
    </FlexBox>
  )
}

export default ImageListTab
