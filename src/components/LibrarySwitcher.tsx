import { ChevronsUpDown, House, Plus } from 'lucide-react'
import React from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import useDataStore from '@/context/data.context'
import { useDialogStore } from '@/context/dialog.context'
import { useServerStore } from '@/context/server.context'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { useNavigate } from 'react-router-dom'

interface Item {
  id: string
  name: string
  logo: React.ElementType
  action: () => void
}

export function LibrarySwitcher({ libraries }: { libraries: Item[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { serverStatus, apiKeyStatus } = useServerStore()
  const { openLibraryDialog } = useDialogStore()
  const { selectedLibraryId } = useDataStore()

  const home = {
    id: '0',
    name: t('home'),
    logo: House,
    action: () => {
      navigate('/home')
    },
  }

  const [activeItem, setActiveItem] = React.useState<Item>(home)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (!selectedLibraryId) {
      setActiveItem(home)
    } else {
      setActiveItem(
        libraries.find((item) => item.id === selectedLibraryId) || home,
      )
    }
  }, [selectedLibraryId])

  const handleItemClick = (item: Item) => {
    setActiveItem(item)
    item.action()
    setIsOpen(false)
  }

  const handleShowDropdown = () => {
    setTimeout(() => {
      setIsOpen(true)
    }, 200)
  }

  return (
    <DropdownMenu open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={'ghost'}
          size="lg"
          className="flex w-45 justify-between gap-3 px-1 focus-visible:ring-0 focus-visible:ring-offset-0"
          onMouseEnter={handleShowDropdown}
          onClick={(e) => {
            e.preventDefault()
            activeItem.action()
          }}
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square items-center justify-center rounded-lg">
            <activeItem.logo className="size-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{activeItem.name}</span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="z-51 w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        side="bottom"
        sideOffset={0}
        onMouseEnter={() => {
          handleShowDropdown()
        }}
        onMouseLeave={() => setIsOpen(false)}
        onInteractOutside={() => setIsOpen(false)}
      >
        {/* Home */}
        <DropdownMenuItem
          key={home.name}
          onClick={() => handleItemClick(home)}
          className="gap-2 p-2"
        >
          <div className="flex size-6 items-center justify-center">
            <home.logo className="size-4 shrink-0" />
          </div>
          {home.name}
        </DropdownMenuItem>

        {/* Libraries List */}
        {libraries && libraries.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t('libraries')}
            </DropdownMenuLabel>
            {libraries.map((item) => (
              <DropdownMenuItem
                key={item.name}
                onClick={() => handleItemClick(item)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center">
                  <item.logo className="size-4 shrink-0" />
                </div>
                {item.name}
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />

        {/* Add Library Button */}
        <DropdownMenuItem
          className="gap-2 p-2"
          disabled={!serverStatus || !apiKeyStatus}
          onClick={() => openLibraryDialog()}
        >
          <div className="bg-background flex size-6 items-center justify-center rounded-md border">
            <Plus className="size-4" />
          </div>
          <div className="text-muted-foreground font-medium">
            {t('libraryWindowTitle')}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
