import LabeledInputWrapper from '@/components/form/LabeledInputWrapper'
import Loading from '@/components/Loading'
import FlexBox from '@/components/ui/FlexBox'
import { Input } from '@/components/ui/input'
import { useServerStore } from '@/context/server.context'
import useFetch from '@/hooks/useFetch'
import { ChevronLeft, FileIcon, FolderIcon, HomeIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface FoldersDialogContentProps {
  setFolders: (folders: string[]) => void
}

type Folder = { name: string; isFolder: boolean }

function FoldersDialogContent({ setFolders }: FoldersDialogContentProps) {
  const { t } = useTranslation()
  const { serverIP } = useServerStore()
  const { fetchData, isLoading } = useFetch()
  const [drives, setDrives] = useState<string[]>([]) // Lista de unidades
  const [folderContent, setFolderContent] = useState<Folder[]>([]) // Contenido de la carpeta
  const [currentPath, setCurrentPath] = useState<string>('') // Ruta actual

  // Fetch para obtener las unidades de disco
  useEffect(() => {
    fetchData(
      `https://${serverIP}/drives`,
      (data) => setDrives(data as string[]),
      (err) => console.error('Error fetching drives:', err),
    )
  }, [])

  // Fetch para obtener el contenido de una carpeta
  const fetchFolderContent = async (path: string) => {
    fetchData(
      `https://${serverIP}/folder/${encodeURIComponent(path)}`,
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

      const upperPath = currentPath.split('\\').slice(0, -1).join('\\')
      fetchFolderContent(upperPath || '') // Si es raíz, reiniciar ruta
    } else {
      // Verificar si currentPath ya termina con '/' o '\'
      const separator =
        currentPath.endsWith('/') || currentPath.endsWith('\\') ? '' : '\\'
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

  return (
    <FlexBox direction="column" gap={1} width={'30rem'} height={'30rem'}>
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
    </FlexBox>
  )
}

export default FoldersDialogContent
