import FlexBox from '@/components/ui/FlexBox'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ContinueWatching from './ContinueWatching'
import MyListMovies from './MyListMovies'
import MyListShows from './MyListShows'

function HomePageContent() {
  const navigate = useNavigate()
  const [minimumLoading, setMinimumLoading] = useState<boolean>(true)

  const goToContent = (url: string) => {
    navigate(url)
  }

  useEffect(() => {
    // Minimum Loading for Skeleton
    setMinimumLoading(true)
    const timer = setTimeout(() => {
      setMinimumLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <FlexBox
      direction="column"
      gap={1}
      padding="2rem 2rem 10rem 2rem"
      scroll="vertical"
      height="100%"
    >
      {/* Continue Watching */}
      <ContinueWatching
        goToContent={goToContent}
        minimumLoading={minimumLoading}
      />

      {/* User's Shows in WatchList */}
      <MyListShows goToContent={goToContent} minimumLoading={minimumLoading} />

      {/* User's Movies in WatchList */}
      <MyListMovies goToContent={goToContent} minimumLoading={minimumLoading} />
    </FlexBox>
  )
}

export default HomePageContent
