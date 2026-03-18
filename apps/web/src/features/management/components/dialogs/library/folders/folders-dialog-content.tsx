import { useGetFileDrives, useGetFileFolder } from '@seerial/api';
import { ChevronLeft, FileIcon, FolderIcon, HomeIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LabeledInputWrapper from '@/shared/forms/labeled-input-wrapper';
import { Button } from '@/shared/ui/button';
import FlexBox from '@/shared/ui/flex-box';
import { Input } from '@/shared/ui/input';
import Loading from '@/shared/ui/loading';

interface FoldersDialogContentProps {
  folders: string[];
  setFolders: (folders: string[]) => void;
  close: () => void;
}

type Folder = { name: string; isFolder: boolean };

function FoldersDialogContent({ folders, setFolders, close }: FoldersDialogContentProps) {
  const { t } = useTranslation();
  const [currentPath, setCurrentPath] = useState<string>('');

  const { data: drives, isLoading } = useGetFileDrives<string[]>();

  const { data: folderContent } = useGetFileFolder<Folder[]>({
    enabled: currentPath !== '',
    params: { path: currentPath },
  });

  // Handler to navigate into folders or go back
  const handleFolderClick = (folder: string) => {
    if (!drives) return;
    if (folder === '.. [Back]') {
      if (
        drives.includes(currentPath) ||
        drives.includes(`${currentPath}\\`) ||
        drives.includes(`${currentPath}/`)
      )
        return;

      let upperPath = currentPath.split('\\').slice(0, -1).join('\\');

      // Check if the current path is a drive unit (E.g. C:, D:, F:)
      const isDriveUnit = /^[A-Z]:$/.test(upperPath);
      if (isDriveUnit) {
        upperPath += '\\';
      }

      setCurrentPath(upperPath || ''); // Go back if no upper path
    } else {
      // Check if the current path ends with '/home' o '\'
      const separator = currentPath.endsWith('/home') || currentPath.endsWith('\\') ? '' : '\\';
      setCurrentPath(`${currentPath}${separator}${folder}`);
    }
  };

  // Render folder content
  const renderFolderContent = () => {
    if (isLoading) return <Loading />;

    return (
      <>
        {/* Go Back button */}
        {currentPath && (
          <FlexBox
            gap={0.5}
            onClick={() => handleFolderClick('.. [Back]')}
            css={{ cursor: 'pointer' }}
          >
            <ChevronLeft />
            .. [Back]
          </FlexBox>
        )}

        {/* Folders and files */}
        {folderContent &&
          folderContent
            .filter(
              (folder) =>
                !folder.name.startsWith('$RECYCLE') &&
                !folder.name.startsWith('{') &&
                !folder.name.endsWith('.tmp'),
            )
            .map((item: { name: string; isFolder: boolean }, index) =>
              item.isFolder ? (
                <FlexBox
                  gap={0.5}
                  key={index}
                  width={'17rem'}
                  onClick={() => handleFolderClick(item.name)}
                  css={{ cursor: 'pointer' }}
                >
                  <FolderIcon /> {item.name}
                </FlexBox>
              ) : (
                <FlexBox gap={0.5} key={index} width={'17rem'} css={{ color: '#a6a6a6' }}>
                  <FileIcon />{' '}
                  <span
                    className="line-clamp-3 w-fit max-w-md overflow-hidden text-ellipsis"
                    style={{ color: '#a6a6a6' }}
                  >
                    {item.name}
                  </span>
                </FlexBox>
              ),
            )}
      </>
    );
  };

  /**
   * Extracts the username from the given path.
   * @param {string} path
   * @returns {string} the username
   */
  const getUserFromPath = (path: string) => {
    const parts = path.split(/[\\/]/);
    return parts.pop();
  };

  const handleAddFolder = () => {
    if (currentPath && currentPath !== '' && !folders.includes(currentPath)) {
      setFolders([...folders, currentPath]);
    }

    close();
  };

  return (
    <FlexBox direction="column" gap={1} height={'32rem'}>
      <FlexBox width={'100%'}>
        <LabeledInputWrapper label={t('addFolder')}>
          <Input type="text" readOnly value={currentPath} className="w-110 bg-white text-black" />
        </LabeledInputWrapper>
      </FlexBox>
      <FlexBox>
        <FlexBox direction="column" width={'10rem'} gap={0.5}>
          {drives &&
            drives.length > 0 &&
            drives.map((drive, index) => (
              <FlexBox
                key={index}
                gap={0.5}
                onClick={() => setCurrentPath(drive)}
                css={{ cursor: 'pointer' }}
              >
                {index === 0 ? <HomeIcon /> : <FolderIcon />}{' '}
                {index === 0 ? getUserFromPath(drive) : drive.replace(/[/\\]$/, '')}
              </FlexBox>
            ))}
        </FlexBox>
        <FlexBox direction="column" width={'20rem'} height={'23rem'} scroll="vertical" gap={0.5}>
          {currentPath && renderFolderContent()}
        </FlexBox>
      </FlexBox>
      <FlexBox width={'100%'} justify="end" gap={1} padding="0 0.5rem">
        <Button variant={'secondary'} onClick={close}>
          {t('cancelButton')}
        </Button>
        <Button onClick={handleAddFolder}>{t('addButton')}</Button>
      </FlexBox>
    </FlexBox>
  );
}

export default FoldersDialogContent;
