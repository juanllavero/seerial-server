import { useIsTablet } from '@/components/hooks/use-tablet'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import Grid from '@/components/ui/Grid'
import { Input } from '@/components/ui/input'
import LazyImage from '@/components/ui/LazyImage'
import { useServerStore } from '@/context/server.context'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ImageListTabProps {
  imagesList: string[]
  localFolder: string
  selectImage: (image: string) => void
  close: () => void
  handleAccept: () => void
  isPoster?: boolean
}

function ImageListTab({
  imagesList,
  localFolder,
  selectImage,
  close,
  handleAccept,
  isPoster = false,
}: ImageListTabProps) {
  const { t } = useTranslation()
  const [loaded, setLoaded] = useState(false)
  const [localImages, setLocalImages] = useState<string[]>([])
  const [pastingUrl, setPastingUrl] = useState<boolean>(false)
  const [urlToDownload, setUrlToDownload] = useState<string>('')
  const isTablet = useIsTablet()

  const { serverIP } = useServerStore()

  useEffect(() => {
    if (!loaded) {
      const fetchLocalImages = async () => {
        try {
          const response = await fetch(`https://${serverIP}/${localFolder}`)
          const data = await response.json()
          setLocalImages(data)
          setLoaded(true)
        } catch (error) {
          setLocalImages([])
          setLoaded(true)
        }
      }

      if (localFolder) fetchLocalImages()
    }
  }, [loaded, serverIP, localFolder])

  return (
    <FlexBox
      direction="column"
      gap={1}
      height={isTablet ? '25rem' : '35rem'}
      width={isTablet ? '100%' : '50rem'}
    >
      <FlexBox
        gap={1}
        justify="center"
        align="center"
        width={'100%'}
        padding="0 0.5rem"
      >
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
              {t('cancel')}
            </Button>
            <Button
              onClick={() => {
                setPastingUrl(false)
                selectImage(urlToDownload)
              }}
            >
              {t('download')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => {}}>{t('loadImage')}</Button>
            <Button onClick={() => setPastingUrl(true)}>{t('pasteUrl')}</Button>
          </>
        )}
      </FlexBox>
      <Grid
        gap={'1rem'}
        columns={`repeat(${isPoster ? 4 : 3}, 1fr)`}
        scroll="vertical"
        hideScrollbar={isTablet}
        padding="0 0.5rem"
      >
        {imagesList &&
          imagesList.map((image) => (
            <div key={image}>
              <LazyImage
                url={image}
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
          localImages.map((image) => (
            <div key={image}>
              <img src={image} alt={image} />
            </div>
          ))}
      </Grid>
    </FlexBox>
  )
}

export default ImageListTab
