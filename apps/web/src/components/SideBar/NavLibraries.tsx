import { API, useCreate, useGetLibraries } from '@seerial/api';
import type { Library } from '@seerial/domain';
import { useIsAdmin } from '@seerial/hooks';
import { useDataStore, useServerStore, useWebSocketStore } from '@seerial/stores';
import { t } from 'i18next';
import {
  Film,
  MoreVertical,
  Music,
  Pencil,
  Plus,
  SearchIcon,
  Trash2,
  TvMinimal,
} from 'lucide-react';
import React, { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { useDialogStore } from '@/context/dialog.store';
import { LibraryTypes } from '@/data/enums/LibraryTypes';
import SmallSpinner from './loading/SmallSpinner';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface Item {
  id: string;
  name: string;
  type: string;
  logo: React.ElementType;
  action: () => void;
}

const NavLibraries = () => {
  const { isMobile } = useSidebar();
  const connectWS = useWebSocketStore((state) => state.connectWS);
  const { analyzing, analyzingLibraryId } = useWebSocketStore(
    (state) => ({
      analyzing: state.analyzing,
      analyzingLibraryId: state.analyzingLibraryId,
    }),
    shallow,
  );
  const navigate = useNavigate();

  const isAdmin = useIsAdmin();
  const { apiKeyStatus } = useServerStore(
    (state) => ({
      apiKeyStatus: state.apiKeyStatus,
    }),
    shallow,
  );
  const { openDialog } = useDialogStore(
    (state) => ({
      openDialog: state.openDialog,
    }),
    shallow,
  );
  const { selectedLibraryId, selectLibrary } = useDataStore(
    (state) => ({
      selectedLibraryId: state.selectedLibraryId,
      selectLibrary: state.selectLibrary,
    }),
    shallow,
  );
  const { create: createRequest } = useCreate<void>();

  const { data, isLoading } = useGetLibraries<ApiResponse<Library[]>>({
    refetchOnWindowFocus: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const libraries = data ? data.data : [];

  const librariesItems =
    libraries && libraries.length > 0
      ? [
          ...libraries.map((library) => ({
            id: library.id,
            name: library.name,
            type: library.type,
            logo:
              library.type === LibraryTypes.SHOWS
                ? TvMinimal
                : library.type === LibraryTypes.MOVIES
                  ? Film
                  : Music,
            action: () => {
              selectLibrary(library.id);
              navigate(`/library/${library.id}`);
            },
          })),
        ]
      : [];

  const searchFiles = async (libraryId: string) => {
    await connectWS();

    await createRequest(API.libraries.scan(libraryId), undefined);
  };

  const [activeItem, setActiveItem] = React.useState<Item | null>(null);

  React.useEffect(() => {
    if (librariesItems) {
      setActiveItem(librariesItems.find((item) => item.id === selectedLibraryId) || null);
    }
  }, [selectedLibraryId, librariesItems]);

  return (
    <>
      {isLoading || !libraries || libraries.length === 0 ? null : (
        <>
          {/* Separator */}
          <SidebarSeparator />

          {/* Libraries */}
          <SidebarGroup>
            <SidebarGroupLabel>{t('libraries')}</SidebarGroupLabel>
            <SidebarMenu>
              {librariesItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild tooltip={item.name}>
                    <Link
                      to={`/library/${item.id}`}
                      className={`flex items-center gap-2 ${
                        activeItem && activeItem.id === item.id ? 'bg-transparent' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();

                        setActiveItem(item);
                      }}
                      style={{
                        color: activeItem && activeItem.id === item.id ? 'var(--app-color)' : '',
                      }}
                    >
                      {analyzingLibraryId === item.id && analyzing ? (
                        <SmallSpinner />
                      ) : (
                        <item.logo />
                      )}
                      <span
                        className="font-semibold"
                        style={{
                          color: activeItem && activeItem.id === item.id ? 'var(--app-color)' : '',
                        }}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction showOnHover>
                          <MoreVertical />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-48 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align={isMobile ? 'end' : 'start'}
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            const library = libraries.find((library) => library.id === item.id);

                            if (library) {
                              openDialog('library', { id: library.id });
                            }
                          }}
                        >
                          <Pencil className="text-muted-foreground" />
                          <span>{t('editButton')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => searchFiles(item.id)}>
                          <SearchIcon className="text-muted-foreground" />
                          <span>{t('searchFiles')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDialog('removeLibrary', { id: item.id })}
                        >
                          <Trash2 className="text-muted-foreground" />
                          <span>{t('removeLibrary')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </>
      )}

      {isAdmin && apiKeyStatus && (
        <>
          {/* Separator */}
          <SidebarSeparator />
          {/* Add Library */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={t('libraryWindowTitle')}
                  onClick={() => {
                    if (!analyzing) {
                      openDialog('library', {});
                    }
                  }}
                >
                  <button
                    type="button"
                    className="flex items-center gap-2"
                    style={{
                      color: analyzing ? '#999999' : '',
                      cursor: analyzing ? 'not-allowed' : '',
                    }}
                    onClick={(e) => e.preventDefault()}
                  >
                    <Plus />
                    <span style={{ color: analyzing ? '#999999' : '' }}>
                      {t('libraryWindowTitle')}
                    </span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>{' '}
        </>
      )}
    </>
  );
};

export default memo(NavLibraries);
