import type { DropdownContent, LibraryItem } from '@seerial/domain';
import { useMediaActionsrial/domain';domain
import { useDataStore, useServerStoreaStore, u@seerial/storese } from '@seerial/stores';
import { Pencilil } fromlucide- 'lucide-react';
import { memoeact';
import { useTranslationion } from 'reai18next';
import { useNavigategate } frreact-router-domr-dom';
import { shallow   openMezustandshallow
} from '
  createMediaCardAction,
  createMediaCardMenuContent,
  getCardPresentation,
  openMediaCardEditDialog,
ry/components/cardslibrary/components/cards/media-card.helpersd.helpers';
import { useDialogStore }eDialogStfeaturesfmanagementtures/management';
import Cardred/cards/card';cards
import { useCardWidthh } from '@/shared/hooks/usecard-widthwidth';
import { useIsMobilerom '@/shakshared/hooks/use-mobilemobile';
import { Button } from '@/shared/ui/button';

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
  const { refreshMetadata, toggleMovieWatched, toggleSeriesWatched } = useMediaActions();

  const { id, title, years, watched } = item;
  const { aspectRatio, errorSrc, imgSrc, cornerNumber } = getCardPresentation(item);

  const action = createMediaCardAction(item, libraryType, navigate, {
    selectSeries,
    selectMovie,
    selectAlbum,
    selectCollection,
  });

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
          <Pencil size={16} />
        </Button>
      }
      errorSrc={errorSrc}
    />
  );
}

export default memo(MediaCard);
