import { API, apiClient, useGet } from '@seerial/api';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsTablet } from '@/shared/hooks/use-tablet';
import { ImageType } from '@/shared/lib/constants';
import { generateRandoumUUID, showToast } from '@/shared/lib/react-utils';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';
import { Input } from '@/shared/ui/input';
import ImageButton from './image-button';

interface LocalImage {
  name: string;
  url: string;
}

interface ImageListTabProps {
  imagesList: string[];
  localFolder: string;
  selectImage: (image: string) => void;
  selectedImage: string;
  type?: ImageType;
}

function ImageListTab({
  imagesList,
  localFolder,
  selectImage,
  selectedImage,
  type = ImageType.BACKDROP,
}: ImageListTabProps) {
  const { t } = useTranslation();
  const [pastingUrl, setPastingUrl] = useState<boolean>(false);
  const [urlToDownload, setUrlToDownload] = useState<string>('');
  const isTablet = useIsTablet();

  // Upload image
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Reference to hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: localImages,
    isLoading,
    mutate,
  } = useGet<LocalImage[]>(
    localFolder ? `${API.images.directoryListing}?path=${encodeURIComponent(localFolder)}` : null,
  );

  const handleImageUpload = () => {
    setImageUrl(null);
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      // Verify if the file is an image
      if (!file.type.startsWith('image/')) {
        showToast('error', t('invalidImageError'));
        return;
      }

      // Create URL for preview
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl);

      // Send the image to the server
      await uploadImage(file);
    }

    // Clear the input after selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('destPath', localFolder);
    formData.append('image', file);

    try {
      await apiClient.post(API.images.upload, formData);
      mutate();
      showToast('success', t('imageLoaded'));
    } catch (_err) {
      showToast('error', t('errorImageUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  const downloadImage = async (url: string) => {
    setIsUploading(true);

    // Extract a clean extension from the URL path, ignoring query strings
    const urlPath = (() => {
      try {
        return new URL(url).pathname;
      } catch {
        return url.split('?')[0];
      }
    })();
    const lastSegment = urlPath.split('/').pop() ?? '';
    const rawExt = lastSegment.includes('.') ? (lastSegment.split('.').pop() ?? '') : '';
    const safeExt = /^[a-zA-Z0-9]{1,10}$/.test(rawExt) ? rawExt : '';
    const fileName = `${generateRandoumUUID()}${safeExt ? `.${safeExt}` : ''}`;

    try {
      await apiClient.post(API.downloads.image, {
        url,
        downloadFolder: localFolder,
        fileName,
      });
      mutate();
      showToast('success', t('imageLoaded'));
    } catch (_err) {
      showToast('error', t('errorImageUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  // Clean up the object URL when the component unmounts
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <FlexBox direction="column" gap={1} height={'100%'}>
      <FlexBox gap={1} justify="center" align="center" width={'100%'} padding="0 0.5rem">
        {/* Hidden input for file selection */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

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
                setPastingUrl(false);
                selectImage(urlToDownload);
              }}
            >
              {t('cancelButton')}
            </Button>
            <Button
              onClick={() => {
                setPastingUrl(false);
                downloadImage(urlToDownload);
              }}
            >
              {t('downloadButton')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleImageUpload} disabled={isUploading}>
              {t('loadImageButton')}
            </Button>
            <Button onClick={() => setPastingUrl(true)} disabled={isUploading}>
              {t('fromURLButton')}
            </Button>
          </>
        )}
      </FlexBox>

      <FlexBox
        gap={1}
        direction="row"
        wrap="wrap"
        scroll="vertical"
        justify="stretch"
        hideScrollbar={isTablet}
        padding="0 1rem"
      >
        {imagesList?.map((image) => (
          <ImageButton
            key={image}
            image={image}
            type={type}
            selectedImage={selectedImage}
            selectImage={selectImage}
          />
        ))}

        {!isLoading &&
          localImages &&
          localImages.map((image: { name: string; url: string }) => (
            <ImageButton
              key={`${image.name} ${image.url}`}
              image={image.url}
              type={type}
              isLocal
              selectedImage={selectedImage}
              selectImage={selectImage}
            />
          ))}
      </FlexBox>
    </FlexBox>
  );
}

export default ImageListTab;
