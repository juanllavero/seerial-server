import React from 'react'
import { Card, CardHeader } from './ui/card'
import { LibrarySwitcher } from './LibrarySwitcher'
import { Settings, Music, Film, TvMinimal, House } from 'lucide-react'
import { Button } from './ui/button'
import useDataStore from '@/context/data.context'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'

function FloatingBox({ isWindows }: { isWindows: boolean }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { libraries, selectLibrary } = useDataStore()

  const home = {
    name: t('home'),
    logo: House,
    action: () => {
      selectLibrary(null)
      navigate({ to: '/' })
    },
  }

  return (
    <div className={`${isWindows ? 'pt-5' : 'pt-10'} pl-5`}>
      <Card>
        <CardHeader className="flex flex-row flex-nowrap justify-start p-3">
          <LibrarySwitcher
            libraries={[
              home,
              ...libraries.map((library) => ({
                name: library.name,
                logo:
                  library.type === 'Shows'
                    ? TvMinimal
                    : library.type === 'Movies'
                      ? Film
                      : Music,
                action: () => {
                  selectLibrary(library)
                  navigate({ to: '/collection' })
                },
              })),
            ]}
          />
          <Button variant="ghost">
            <Settings />
          </Button>
        </CardHeader>
      </Card>
    </div>
  )
}

export default React.memo(FloatingBox)
