import type { DropdownContent, LibraryItem } from '@seerial/domain';
import { Pencil } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import Card from '@/components/cards/Card';
import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useServerStore } from '@seerial/stores';
import { useDataStore } from '@seerial/stores';
import { useDialogStore } from '@/context/dialog.store';
import { useCardWidth } from '@/hooks/useCardWidth';
import { refreshMetadata, toggleMovieWatched, toggleSeriesWatched } from '@/utils/ReactUtils';

interface MediaCardProps {
  item: LibraryItem;
  libraryType: string;
}

function MediaCard({ item, libraryType }: MediaCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cardWidth } = useCardWidth();
  const isMobile = useIsMobile();
  const width = isMobile ? '100%' : cardWidth * 1.2;

  const { user } = useServerStore((state) => ({ user: state.currentUser }), shallow);
  const { selectSeries, selectMovie, selectAlbum, selectCollection } = useDataStore(
    (state) => ({
      selectSeries: state.selectSeries,
      selectMovie: state.selectMovie,
      selectAlbum: state.selectAlbum,
      selectCollection: state.selectCollection,
    }),
    shallow,
  );
  const { openDialog } = useDialogStore((state) => ({ openDialog: state.openDialog }), shallow);

  const { type, id } = item;
  const isCollection = type === 'collection';
  const isShows = type === 'series';
  const isMovies = type === 'movie';
  const isMusic = type === 'album';

  const aspectRatio = isMusic ? 1 : 2 / 3;
  const errorSrc = isMusic ? '/img/songDefault.png' : '/img/fileNotFound.jpg';
  const imgSrc = item.coverSrc && item.coverSrc !== '' ? item.coverSrc : errorSrc;
  const title = item.title;
  const subtitle = item.years ?? '-';
  const watched = item.watched;
  const cornerNumber = isShows ? item.remainingItems : undefined;

  let action: () => void;

  if (isCollection) {
    action = () => {
      selectCollection(id);
      navigate(`/collection/${id}/${libraryType}`);
    };
  } else if (isShows) {
    action = () => {
      selectSeries(id);
      navigate(`series/${id}`);
    };
  } else if (isMovies) {
    action = () => {
      selectMovie(id);
      navigate(`movie/${id}`);
    };
  } else if (isMusic) {
    action = () => {
      selectAlbum(id);
      navigate(`album/${id}`);
    };
  } else {
    return null;
  }

  const menuContent: DropdownContent = {
    items: [
      {
        separator: false,
        items: [
          ...(isShows || isMovies || isMusic
            ? [
                {
                  title: t('updateMetadata'),
                  action: () =>
                    isShows || isMovies
                      ? refreshMetadata(isShows ? 'show' : 'movie', id)
                      : console.log('Update metadata'),
                },
              ]
            : []),
          ...(isShows || isMovies
            ? [
                {
                  title: t('correctIdentification'),
                  action: () =>
                    openDialog('identification', {
                      seriesId: isShows ? id : undefined,
                      movieId: isMovies ? id : undefined,
                    }),
                },
              ]
            : []),
          ...(isShows
            ? [
                {
                  title: t('changeEpisodesGroup'),
                  action: () => openDialog('episodesGroup', { seriesId: id }),
                },
              ]
            : []),
          ...(isShows || isMovies
            ? [
                {
                  title: watched ? t('markUnwatched') : t('markWatched'),
                  action: () =>
                    user &&
                    (isShows
                      ? toggleSeriesWatched(id, !watched, user.id)
                      : toggleMovieWatched(id, !watched, user.id)),
                },
              ]
            : []),
        ],
      },
      { separator: true, items: [] },
      {
        separator: false,
        items: [
          {
            title: t('removeButton'),
            action: () => console.log('Remove clicked'),
          },
        ],
      },
    ],
  };

  const openEditDialog = () => {
    if (isCollection) openDialog('collection', { id });
    else if (isShows) openDialog('series', { id });
    else if (isMovies) openDialog('movie', { id });
    else if (isMusic) openDialog('album', { id });
  };

  return (
    <Card
      itemKey={id}
      width={width}
      imgSrc={imgSrc}
      aspectRatio={aspectRatio}
      title={title}
      subtitle={subtitle}
      cornerData=""
      cornerNumber={cornerNumber}
      action={action}
      watched={watched}
      loading={false}
      hidePlayButton
      menu={menuContent}
      editModal={
        <Button
          variant={'ghost'}
          size={'icon'}
          onClick={(e) => {
            e.stopPropagation();
            openEditDialog();
          }}
        >
          <Pencil size={16} />
        </Button>
      }
      errorSrc={errorSrc}
    />
  );
}

export default memo(MediaCard);
