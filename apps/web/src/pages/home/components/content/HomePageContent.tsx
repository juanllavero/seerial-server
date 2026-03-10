import { useNavigate } from 'react-router-dom'
import FlexBox from '@/components/ui/FlexBox'
import ContinueWatching from './ContinueWatching'
import MyListMovies from './MyListMovies'
import MyListShows from './MyListShows'

function HomePageContent() {
  const navigate = useNavigate()

  const goToContent = (url: string) => {
    navigate(url)
  }

  return (
    <FlexBox
      direction="column"
      gap={1}
      padding="2rem 2rem 10rem 2rem"
      scroll="vertical"
      height="100%"
    >
      {/* Continue Watching */}
      <ContinueWatching goToContent={goToContent} />

      {/* User's Shows in WatchList */}
      <MyListShows goToContent={goToContent} />

      {/* User's Movies in WatchList */}
      <MyListMovies goToContent={goToContent} />
    </FlexBox>
  )
}

export default HomePageContent
