import type { DropdownContent, LibraryItem, LibraryType } from '@seerial/domain';
import { useDataStore, useServerStore } from '@seerial/stores';
import { Pencil } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { useDialogStore } from '@/features/management';
import { useCardWidth } from '@/shared/hooks/use-card-width';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useMediaActions } from '@/shared/lib/react-utils';
import { Button } from '@/shared/ui/button';
import {
  createMediaCardAction,
  createMediaCardMenuContent,
  getCardPresentation,
  openMediaCardEditDialog,
} from './media-card.helpers';
import Card from '@/shared/cards/card';

interface MediaCardProps {
  item: LibraryItem;
  libraryType: LibraryType;
  libraryId: string;
}

function MediaCard({ item, libraryType, libraryId }: MediaCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cardWidth } = useCardWidth();
  const isMobile = useIsMobile();
  const width = isMobile ? '100%' : `${cardWidth * 1.2}px`;

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
  const { refreshMetadata, toggleMovieWatched, toggleSeriesWatched } = useMediaActions();

  const { id, title, years, watched } = item;
  const { aspectRatio, errorSrc, imgSrc, cornerNumber } = getCardPresentation(item, libraryType);

  const action = createMediaCardAction(
    item,
    libraryType,
    navigate,
    {
      selectSeries,
      selectMovie,
      selectAlbum,
      selectCollection,
    },
    libraryId,
  );

  const menuContent: DropdownContent = createMediaCardMenuContent({
    item,
    t,
    userId: user?.id,
    openDialog,
    actions: {
      refreshMetadata,
      toggleMovieWatched,
      toggleSeriesWatched,
    },
  });

  return (
    <Card
      itemKey={id}
      width={width}
      imgSrc={imgSrc}
      aspectRatio={aspectRatio}
      title={title}
      subtitle={years ?? '-'}
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
            openMediaCardEditDialog(item, openDialog);
          }}
        >
          <Pencil size={16} fill="currentColor" />
        </Button>
      }
      errorSrc={errorSrc}
    />
  );
}

export default memo(MediaCard);
