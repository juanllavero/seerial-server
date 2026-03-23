import { useGet } from '@seerial/api';
import type { Collection, CollectionImages } from '@seerial/domain';
import { getCoverSize, getFirstImage, getPosterImage } from '@seerial/domain';
import { useEffect, useState } from 'react';
import useScreenHeight from '@/shared/hooks/use-height';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import Image from '@/shared/ui/image';

interface CollectionImageProps {
  collection: Collection;
  type: string;
}

function CollectionImage({ collection, type }: CollectionImageProps) {
  const screenHeight = useScreenHeight();
  const isMobile = useIsMobile();
  const [posterImage, setPosterImage] = useState<string>('');
  const { data: collectionImages } = useGet<CollectionImages>(
    `/collection-images?collectionId=${collection.id}&&type=${type}`,
  );

  useEffect(() => {
    if (collectionImages) {
      setPosterImage(
        collection.coverSrc && collection.coverSrc !== ''
          ? collection.coverSrc
          : collectionImages.poster && collectionImages.poster !== ''
            ? collectionImages.poster
            : getFirstImage(collection, type),
      );
    }
  }, [collectionImages]);

  if (collectionImages && collectionImages.images && collectionImages.images.length > 1) {
    return (
      <div
        className={`${isMobile ? `h-screen ${type === 'Music' ? 'max-h-[55dvw]' : 'max-h-[80dvw]'} w-screen max-w-[55dvw]` : getCoverSize(screenHeight, type !== 'Music', false)}`}
      >
        {getPosterImage(collection.id, collectionImages.images ?? [], type)}
      </div>
    );
  }

  return (
    <div
      className={`${isMobile ? `h-screen ${type === 'Music' ? 'max-h-[55dvw]' : 'max-h-[80dvw]'} w-screen max-w-[55dvw]` : getCoverSize(screenHeight, type !== 'Music', false)}`}
    >
      <Image
        url={posterImage}
        aspectRatio={type === 'Music' ? 1 : 2 / 3}
        fallbackSrc={type === 'Music' ? '/img/songDefault.png' : '/img/fileNotFound.jpg'}
        alt={'Collection Image'}
      />
    </div>
  );
}

export default CollectionImage;
