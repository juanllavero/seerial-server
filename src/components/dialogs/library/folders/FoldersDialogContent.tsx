import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { useServerStore } from '@/context/server.context'
import useFetch from '@/hooks/useFetch'
import { ChevronLeft, FileIcon, FolderIcon, HomeIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface FoldersDialogContentProps {
  folders: string[]
  setFolders: (folders: string[]) => void
  close: () => void
}

type Folder = { name: string; isFolder: boolean }

function FoldersDialogContent({
  folders,
  setFolders,
  close,
}: FoldersDialogContentProps) {
  const { t } = useTranslation()
  const { selectedServer } = useServerStore()
  const { fetchData, isLoading } = useFetch()
  const [drives, setDrives] = useState<string[]>([]) // Lista de unidades
  const [folderContent, setFolderContent] = useState<Folder[]>([]) // Contenido de la carpeta
  const [currentPath, setCurrentPath] = useState<string>('') // Ruta actual

  // Fetch para obtener las unidades de disco
  useEffect(() => {
    fetchData(
      `https://${selectedServer?.ip}/drives`,
      (data) => setDrives(data as string[]),
      (err) => console.error('Error fetching drives:', err),
    )
  }, [])

  // Fetch para obtener el contenido de una carpeta
  const fetchFolderContent = async (path: string) => {
    fetchData(
      `https://${selectedServer?.ip}/folder/${encodeURIComponent(path)}`,
      (data) => {
        setFolderContent(data as Folder[])
        setCurrentPath(path)
      },
      (_err) => setFolderContent([]),
    )
  }

  // Manejador para cuando el usuario selecciona una carpeta o unidad
  const handleFolderClick = (folder: string) => {
    if (folder === '.. [Back]') {
      if (
        drives.includes(currentPath) ||
        drives.includes(`${currentPath}\\`) ||
        drives.includes(`${currentPath}/`)
      )
        return

      let upperPath = currentPath.split('\\').slice(0, -1).join('\\')

      // Comprobar si upperPath es una unidad de almacenamiento (ej. C:, D:, F:)
      const isDriveUnit = /^[A-Z]:$/.test(upperPath)
      if (isDriveUnit) {
        upperPath += '\\'
      }

      fetchFolderContent(upperPath || '') // Si es raíz, reiniciar ruta
    } else {
      // Verificar si currentPath ya termina con '/home' o '\'
      const separator =
        currentPath.endsWith('/home') || currentPath.endsWith('\\') ? '' : '\\'
      fetchFolderContent(`${currentPath}${separator}${folder}`)
    }
  }

  // Renderizar las unidades o carpetas
  const renderFolderContent = () => {
    if (isLoading) return <Loading />

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
                <FlexBox
                  gap={0.5}
                  key={index}
                  width={'17rem'}
                  css={{ color: '#a6a6a6' }}
                >
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
    )
  }

  /**
   * Extracts the username from the given path.
   * @param {string} path
   * @returns {string} the username
   */
  const getUserFromPath = (path: string) => {
    const parts = path.split(/[\\/]/)
    return parts.pop()
  }

  const handleAddFolder = () => {
    if (currentPath && currentPath !== '' && !folders.includes(currentPath)) {
      setFolders([...folders, currentPath])
    }

    close()
  }

  return (
    <FlexBox direction="column" gap={1} height={'32rem'}>
      <FlexBox width={'100%'}>
        <LabeledInputWrapper label={t('addFolder')}>
          <Input
            type="text"
            readOnly
            value={currentPath}
            className="w-110 bg-white text-black"
          />
        </LabeledInputWrapper>
      </FlexBox>
      <FlexBox>
        <FlexBox direction="column" width={'10rem'} gap={0.5}>
          {drives.length > 0 &&
            drives.map((drive, index) => (
              <FlexBox
                key={index}
                gap={0.5}
                onClick={() => fetchFolderContent(drive)}
                css={{ cursor: 'pointer' }}
              >
                {index === 0 ? <HomeIcon /> : <FolderIcon />}{' '}
                {index === 0
                  ? getUserFromPath(drive)
                  : drive.replace(/[\/\\]$/, '')}
              </FlexBox>
            ))}
        </FlexBox>
        <FlexBox
          direction="column"
          width={'20rem'}
          height={'23rem'}
          scroll="vertical"
          gap={0.5}
        >
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
  )
}

export default FoldersDialogContent
