import { useIsMobile } from '@/components/hooks/use-mobile'
import Loading from '@/components/Loading'
import NotFound from '@/components/NotFound'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import LazyImage from '@/components/ui/LazyImage'
import { useServerStore } from '@/context/server.context'
import { Collection } from '@/data/interfaces/Media'
import { fetcher } from '@/utils/utils'
import { useParams } from '@tanstack/react-router'
import { Edit, Ellipsis } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import '../DetailsPage.css'

function CollectionDetailsPage() {
  const { collectionId, isMusic } = useParams({
    from: '/details/collection/$collectionId/$isMusic',
  })
  const { t } = useTranslation()
  const { serverIP } = useServerStore()
  const isMobile = useIsMobile()

  // Get collection data
  const { data: collection, isLoading } = useSWR<Collection>(
    collectionId
      ? `http://${serverIP}/details/collection?id=${collectionId}`
      : null,
    fetcher,
  )

  const [currentPoster, setCurrentPoster] = useState<string | undefined>()
  const [nextPoster, setNextPoster] = useState<string | undefined>()
  const [showAnimPoster, setShowAnimPoster] = useState(false)

  const posterUrl = collection?.coverSrc

  useEffect(() => {
    setNextPoster(posterUrl)
    setShowAnimPoster(true)

    setTimeout(() => {
      setCurrentPoster(posterUrl)
      setTimeout(() => {
        setShowAnimPoster(false)
      }, 100)
    }, 1000)
  }, [posterUrl])

  if (isLoading) {
    return <Loading />
  }

  if (!collection) {
    return <NotFound />
  }

  return (
    <FlexBox
      className="details-container"
      direction="column"
      gap={1}
      wrap="nowrap"
      padding={isMobile ? '10rem 0' : '10rem 3rem'}
      height={'100%'}
    >
      <FlexBox justify="start" align="start" gap={4}>
        {!isMobile && (
          <div className="cover-container">
            <FlexBox className="image-container">
              <LazyImage
                url={currentPoster}
                width={350}
                maxHeight={550}
                height={isMusic ? 300 : 550}
                errorSrc={
                  isMusic ? '/img/songDefault.png' : '/img/fileNotFound.jpg'
                }
              />
            </FlexBox>

            {showAnimPoster && (
              <FlexBox className="image-container-animated fade-in">
                <LazyImage
                  url={nextPoster}
                  width={350}
                  maxHeight={550}
                  height={isMusic ? 300 : 550}
                  errorSrc={
                    isMusic ? '/img/songDefault.png' : '/img/fileNotFound.jpg'
                  }
                />
              </FlexBox>
            )}
          </div>
        )}

        <FlexBox
          direction="column"
          gap={1}
          width={isMobile ? '100%' : '80%'}
          padding={isMobile ? '0 2rem' : '0'}
        >
          <span
            id="details-title"
            style={{
              textTransform: 'uppercase',
            }}
          >
            {collection.title}
          </span>
          <FlexBox gap={1} wrap="wrap">
            <Button variant={'ghost'} title={t('editButton')}>
              <Edit />
            </Button>
            <Button
              variant={'ghost'}
              // onClick={(e) => {
              //   dispatch(toggleSeasonMenu())
              //   if (!seasonMenuOpen) cm.current?.show(e)
              // }}
            >
              <Ellipsis />
            </Button>
          </FlexBox>
          <FlexBox>
            <span className="font-semibold">
              {collection.description || t('defaultOverview')}
            </span>
          </FlexBox>
        </FlexBox>
      </FlexBox>

      {/* Content */}

      {/* Library Name (Anime, Music, Soundtracks, Movies...) --> Content */}
    </FlexBox>
  )
}

export default CollectionDetailsPage
