import type { DropdownContent, DropdownItem, LibraryItem } from '@seerial/domain';
import type { NavigateFunction } from 'react-router-dom';
import type { DialogName, DialogPayloads } from '@/features/management';

interface SelectionActions {
  selectSeries: (id: string) => void;
  selectMovie: (id: string) => void;
  selectAlbum: (id: string) => void;
  selectCollection: (id: string) => void;
}

interface CardPresentation {
  aspectRatio: number;
  errorSrc: string;
  imgSrc: string;
  cornerNumber?: number;
}

interface MenuActions {
  refreshMetadata: (type: 'show' | 'movie', id: string) => void;
  toggleMovieWatched: (movieId: string, watched: boolean, userId: string) => void;
  toggleSeriesWatched: (seriesId: string, watched: boolean, userId: string) => void;
}

type OpenDialog = <T extends DialogName>(name: T, payload: DialogPayloads[T]) => void;
type Translate = (key: string) => string;

interface MenuOptions {
  item: LibraryItem;
  t: Translate;
  userId?: string;
  openDialog: OpenDialog;
  actions: MenuActions;
}

export function getCardPresentation(item: LibraryItem): CardPresentation {
  const isMusic = item.type === 'album';
  const errorSrc = isMusic ? '/img/songDefault.png' : '/img/fileNotFound.jpg';

  return {
    aspectRatio: isMusic ? 1 : 2 / 3,
    errorSrc,
    imgSrc: item.coverSrc && item.coverSrc !== '' ? item.coverSrc : errorSrc,
    cornerNumber: item.type === 'series' ? item.remainingItems : undefined,
  };
}

export function createMediaCardAction(
  item: LibraryItem,
  libraryType: string,
  navigate: NavigateFunction,
  actions: SelectionActions,
) {
  const navigationByType: Record<
    LibraryItem['type'],
    { select: (id: string) => void; path: string }
  > = {
    collection: {
      select: actions.selectCollection,
      path: `/collection/${item.id}/${libraryType}`,
    },
    series: {
      select: actions.selectSeries,
      path: `series/${item.id}`,
    },
    movie: {
      select: actions.selectMovie,
      path: `movie/${item.id}`,
    },
    album: {
      select: actions.selectAlbum,
      path: `album/${item.id}`,
    },
  };

  const navigation = navigationByType[item.type];

  return () => {
    navigation.select(item.id);
    navigate(navigation.path);
  };
}

export function createMediaCardMenuContent({ item, t, userId, openDialog, actions }: MenuOptions) {
  const isSeries = item.type === 'series';
  const isMovie = item.type === 'movie';
  const isAlbum = item.type === 'album';
  const isSeriesOrMovie = isSeries || isMovie;
  const mediaActions: DropdownItem[] = [];

  if (isSeries || isMovie || isAlbum) {
    mediaActions.push({
      title: t('updateMetadata'),
      action: () => {
        if (isSeries) {
          actions.refreshMetadata('show', item.id);
          return;
        }

        if (isMovie) {
          actions.refreshMetadata('movie', item.id);
          return;
        }

        console.log('Update metadata');
      },
    });
  }

  if (isSeriesOrMovie) {
    mediaActions.push({
      title: t('correctIdentification'),
      action: () =>
        openDialog('identification', {
          seriesId: isSeries ? item.id : undefined,
          movieId: isMovie ? item.id : undefined,
        }),
    });
  }

  if (isSeries) {
    mediaActions.push({
      title: t('changeEpisodesGroup'),
      action: () => openDialog('episodesGroup', { seriesId: item.id }),
    });
  }

  if (isSeriesOrMovie) {
    mediaActions.push({
      title: item.watched ? t('markUnwatched') : t('markWatched'),
      action: () => {
        if (!userId) {
          return;
        }

        if (isSeries) {
          actions.toggleSeriesWatched(item.id, !item.watched, userId);
          return;
        }

        actions.toggleMovieWatched(item.id, !item.watched, userId);
      },
    });
  }

  return {
    items: [
      {
        separator: false,
        items: mediaActions,
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
  } satisfies DropdownContent;
}

export function openMediaCardEditDialog(item: LibraryItem, openDialog: OpenDialog) {
  const dialogByType: Record<LibraryItem['type'], 'collection' | 'series' | 'movie' | 'album'> = {
    collection: 'collection',
    series: 'series',
    movie: 'movie',
    album: 'album',
  };

  openDialog(dialogByType[item.type], { id: item.id });
}
