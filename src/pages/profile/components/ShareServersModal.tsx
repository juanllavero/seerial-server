import { useEffect, useState } from 'react'
import FlexBox from '@/components/ui/FlexBox'
import { useAuth } from '@/context/auth.context'
import { Server, SharedServer } from '@/data/interfaces/Users'
import useSWR from 'swr'
import { useServerStore } from '@/context/server.context'
import { authenticatedFetcher } from '@/utils/utils'
import { Film, Music, TvMinimal } from 'lucide-react'
import { Library } from '@/data/interfaces/Media'
import { LibraryTypes } from '@/data/enums/LibraryTypes'
import { useIsMobile } from '@/components/hooks/use-mobile'
import { useIsTablet } from '@/components/hooks/use-tablet'
import { getSharedServers, shareLibraries } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

function ShareServersModal({ toUserId }: { toUserId: string }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { serverUrl } = useServerStore()
  const servers: Server[] = user ? user.servers.filter((s) => !s.shared) : []
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [alreadyShared, setAlreadyShared] = useState<SharedServer[]>([])
  const updateInterval = 3000

  // useEffect(() => {
  //   updateSharedServers()
  //   const interval = setInterval(updateSharedServers, updateInterval)
  //   return () => clearInterval(interval)
  // }, [])

  const updateSharedServers = async () => {
    const shared = await getSharedServers(toUserId)
    setAlreadyShared(shared)

    console.log({ shared })

    // Auto select libraries
    const preselected: Record<string, string[]> = {}
    shared.forEach((s) => {
      preselected[s.serverId] = s.libraries
    })
    setSelected(preselected)
  }

  const toggleServer = (serverId: string, libraries: Library[]) => {
    setSelected((prev) => {
      const allSelected = prev[serverId]?.length === libraries.length
      return {
        ...prev,
        [serverId]: allSelected ? [] : libraries.map((lib) => lib.id),
      }
    })
  }

  const toggleLibrary = (serverId: string, libraryId: string) => {
    setSelected((prev) => {
      const current = prev[serverId] || []
      const alreadySelected = current.includes(libraryId)
      return {
        ...prev,
        [serverId]: alreadySelected
          ? current.filter((id) => id !== libraryId)
          : [...current, libraryId],
      }
    })
  }

  const shareSelectedLibraries = async () => {
    await Promise.all(
      Object.entries(selected).map(([serverId, libraries]) => {
        shareLibraries(serverId, toUserId, libraries)
      }),
    )
  }

  return (
    <FlexBox
      direction="column"
      gap={4}
      justify="space-between"
      padding="1rem 0 0 0"
      height={'50dvh'}
      width={isMobile || isTablet ? '100%' : '35rem'}
      scroll="vertical"
      hideScrollbar
    >
      {servers && servers.length > 0 ? (
        servers.map((server) => {
          const {
            data: libraries,
            error,
            isLoading,
          } = useSWR<Library[]>(
            serverUrl ? `${serverUrl}/libraries/` : null,
            authenticatedFetcher,
          )

          const disabled =
            isLoading || error || !libraries || libraries.length === 0
          const allSelected =
            !disabled && selected[server.id]?.length === libraries?.length

          return (
            <div key={server.id} className="w-full rounded-lg border p-3">
              <FlexBox
                className="mb-2 flex items-center"
                width={'100%'}
                align="center"
                justify="space-between"
                margin="0 0 0.5rem 0"
                gap={1}
              >
                <span className="font-semibold">{server.name}</span>
                {disabled && (
                  <span className="text-sm text-gray-500">
                    {t('notAvailable')}
                  </span>
                )}
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={allSelected}
                  onChange={() =>
                    !disabled && libraries && toggleServer(server.id, libraries)
                  }
                />
              </FlexBox>

              {!disabled && (
                <div className="ml-3 flex flex-col gap-1">
                  {libraries?.map((lib) => (
                    <label key={lib.id} className="flex items-center gap-2">
                      <FlexBox
                        gap={1}
                        justify="space-between"
                        align="center"
                        width={'100%'}
                      >
                        <FlexBox gap={1} align="center">
                          <div>
                            {lib.type === LibraryTypes.SHOWS ? (
                              <TvMinimal size={15} />
                            ) : lib.type === LibraryTypes.MOVIES ? (
                              <Film size={15} />
                            ) : (
                              <Music size={15} />
                            )}
                          </div>
                          <span>{lib.name}</span>
                        </FlexBox>
                        <input
                          type="checkbox"
                          checked={
                            selected[server.id]?.includes(lib.id) || false
                          }
                          onChange={() => toggleLibrary(server.id, lib.id)}
                        />
                      </FlexBox>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })
      ) : (
        <span>{t('noOwnServers')}</span>
      )}

      <FlexBox gap={1} justify="end" width={'100%'}>
        <Button
          disabled={!servers || servers.length <= 0}
          onClick={shareSelectedLibraries}
        >
          {t('shareButton')}
        </Button>
      </FlexBox>
    </FlexBox>
  )
}

export default ShareServersModal
