import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import { Input } from '@/components/ui/input'
import LazyImage from '@/components/ui/LazyImage'
import { useServerStore } from '@/context/server.context'
import { generateRandoumUUID, showToast } from '@/utils/ReactUtils'
import { fetcher } from '@/utils/utils'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import './ImageListTab.css'

interface LocalImage {
  name: string
  url: string
}

interface ImageListTabProps {
  imagesList: string[]
  localFolder: string
  selectImage: (image: string) => void
  selectedImage: string
  isPoster?: boolean
}

function ImageListTab({
  imagesList,
  localFolder,
  selectImage,
  selectedImage,
  isPoster = false,
}: ImageListTabProps) {
  const { t } = useTranslation()
  const { selectedServer } = useServerStore()
  const [loaded, setLoaded] = useState(false)
  //const [localImages, setLocalImages] = useState<LocalImage[]>([])
  const [pastingUrl, setPastingUrl] = useState<boolean>(false)
  const [urlToDownload, setUrlToDownload] = useState<string>('')
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()

  // Upload image
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  // Reference to hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: localImages, isLoading } = useSWR<LocalImage[]>(
    localFolder
      ? `https://${selectedServer?.ip}/images?path=${localFolder}`
      : null,
    fetcher,
  )

  // useEffect(() => {
  //   const fetchLocalImages = async () => {
  //     try {
  //       const response = await fetch(
  //         `https://${selectedServer?.ip}/images?path=${localFolder}`,
  //       )
  //       const data = await response.json()
  //       setLocalImages(data)
  //       setLoaded(true)
  //     } catch (error) {
  //       setLocalImages([])
  //       setLoaded(true)
  //     }
  //   }

  //   if (localFolder && !isUploading) fetchLocalImages()
  // }, [selectedServer, localFolder, isUploading])

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
      const response = await fetch(
        `https://${selectedServer?.ip}/uploadImage`,
        {
          method: 'POST',
          body: formData,
        },
      )

      if (!response.ok) {
        throw new Error()
      }

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
      const response = await fetch(
        `https://${selectedServer?.ip}/downloadImage`,
        {
          method: 'POST',
          body: JSON.stringify({
            url: url,
            downloadFolder: localFolder,
            fileName: generateRandoumUUID(),
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        throw new Error()
      }

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

  if (isLoading) {
    return (
      <FlexBox direction="column" gap={1} height={isTablet ? '25rem' : '35rem'}>
        <Loading />
      </FlexBox>
    )
  }

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
      <Grid
        gap={'1rem'}
        columns={`repeat(${isPoster ? (isMobile ? 3 : 4) : isMobile ? 2 : 3}, 1fr)`}
        scroll="vertical"
        hideScrollbar={isTablet}
        padding="0 0.5rem"
      >
        {imagesList &&
          imagesList.map((image) => (
            <div
              key={image}
              onClick={() =>
                selectImage(
                  image.startsWith('http')
                    ? image
                    : `http://image.tmdb.org/t/p/original/${image}`,
                )
              }
            >
              <LazyImage
                className={`image-list-img ${selectedImage === image || selectedImage.endsWith(image) ? 'selected-image' : ''}`}
                url={
                  image.startsWith('http')
                    ? image
                    : `http://image.tmdb.org/t/p/original/${image}`
                }
                alt={image}
                errorSrc={
                  isPoster
                    ? '/img/fileNotFound.jpg'
                    : '/img/Default_video_thumbnail.jpg'
                }
              />
            </div>
          ))}

        {loaded &&
          localImages &&
          localImages.map(
            (image: { name: string; url: string }, index: number) => (
              <div
                key={image.url ?? 'Image ' + index}
                onClick={() => selectImage(image.url)}
              >
                <LazyImage
                  className={`image-list-img ${selectedImage === image.url ? 'selected-image' : ''}`}
                  url={image.url}
                  alt={image.name}
                  errorSrc={
                    isPoster
                      ? '/img/fileNotFound.jpg'
                      : '/img/Default_video_thumbnail.jpg'
                  }
                />
              </div>
            ),
          )}
      </Grid>
    </FlexBox>
  )
}

export default ImageListTab
