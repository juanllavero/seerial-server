import Card from '@/components/cards/Card'
import { ModalWrapper } from '@/components/ModalWrapper'
import { Button } from '@/components/ui/button'
import useDataStore from '@/context/data.context'
import { Episode, Library, Season, Series } from '@/data/interfaces/Media'
import { DropdownContent } from '@/data/interfaces/Utils'
import { AddServerForm } from '@/pages/home/components/AddServerModal'
import { useNavigate } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import React from 'react'

function CollectionCard({
  library,
  series,
}: {
  library: Library
  series: Series
}) {
  const navigate = useNavigate()
  const { selectSeries } = useDataStore()

  const getNumberOfEpisodesLeft = () => {
    if (library.type === 'Music') {
      return 0
    }

    return series.seasons
      ? series.seasons
          .map((season: Season) =>
            season.episodes && season.episodes.length > 0
              ? season.episodes.map((episode: Episode) =>
                  episode.watched ? 0 : 1,
                )
              : 0,
          )
          .flatMap((num) => (num instanceof Array ? num : [num]))
          .reduce((acc, num) => acc + (num === 1 ? 1 : 0), 0)
      : 0
  }

  const content: DropdownContent = {
    items: [
      {
        separator: false,
        items: [
          {
            title: 'Profile',
            action: () => console.log('Profile clicked'),
          },
          {
            title: 'Billing',
            action: () => console.log('Billing clicked'),
          },
          {
            title: 'Settings',
            action: () => console.log('Settings clicked'),
          },
          {
            title: 'Keyboard shortcuts',
            action: () => console.log('Keyboard shortcuts clicked'),
          },
        ],
      },
      { separator: true, items: [] },
      {
        separator: false,
        items: [
          {
            title: 'Log out',
            shortcut: '⇧⌘Q',
            action: () => console.log('Log out clicked'),
          },
        ],
      },
    ],
  }

  return (
    <Card
      itemKey={series.id}
      imgSrc={
        library.type === 'Movies' &&
        !series.isCollection &&
        series.seasons &&
        series.seasons.length > 0
          ? series.seasons[0].coverSrc
          : series.coverSrc
      }
      width={200}
      aspectRatio={library.type === 'Music' ? 1 : 2 / 3}
      title={series.name}
      subtitle={(() => {
        const minYear = Math.min(
          ...(series.seasons
            ? series.seasons.map((season: Season) =>
                Number.parseInt(season.year),
              )
            : []),
        )
        const maxYear = Math.max(
          ...(series.seasons
            ? series.seasons.map((season: Season) =>
                Number.parseInt(season.year),
              )
            : []),
        )
        return minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`
      })()}
      cornerData={''}
      cornerNumber={getNumberOfEpisodesLeft()}
      watched={series.watched}
      action={() => {
        selectSeries(series)
        navigate({
          to: '/details/$libraryId/$seriesId',
          params: { libraryId: library.id, seriesId: series.id },
        })
      }}
      hidePlayButton
      menu={content}
      editModal={
        <ModalWrapper
          title={'Add Server IP'}
          tabs={[
            {
              title: 'Tab 1',
              content: <AddServerForm />,
            },
            {
              title: 'Tab 2',
              content: <h2>Test</h2>,
            },
          ]}
          button={
            <Button
              variant={'ghost'}
              size={'icon'}
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil size={16} />
            </Button>
          }
        />
      }
    />
  )
}

export default CollectionCard
