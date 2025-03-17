import { ChevronsUpDown, Plus } from 'lucide-react'
import React from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDialogStore } from '@/context/dialog.context'
import { Button } from './ui/button'
import useDataStore from '@/context/data.context'

interface Item {
  id: string
  name: string
  logo: React.ElementType
  action: () => void
}

export function LibrarySwitcher({ libraries }: { libraries: Item[] }) {
  const { openLibraryDialog } = useDialogStore()
  const { selectedLibrary } = useDataStore()
  const [activeItem, setActiveItem] = React.useState<Item>(libraries[0])
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (!selectedLibrary) {
      setActiveItem(libraries[0])
    } else {
      setActiveItem(libraries.find((item) => item.id === selectedLibrary.id) || libraries[0])
    }
  }, [selectedLibrary])

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
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        side="bottom"
        sideOffset={0}
        onMouseEnter={() => {
          handleShowDropdown()
        }}
        onMouseLeave={() => setIsOpen(false)}
        onInteractOutside={() => setIsOpen(false)}
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Libraries
        </DropdownMenuLabel>
        {libraries.map((item) => (
          <DropdownMenuItem
            key={item.name}
            onClick={() => handleItemClick(item)}
            className="gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-xs border">
              <item.logo className="size-4 shrink-0" />
            </div>
            {item.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 p-2"
          onClick={() => openLibraryDialog()}
        >
          <div className="bg-background flex size-6 items-center justify-center rounded-md border">
            <Plus className="size-4" />
          </div>
          <div className="text-muted-foreground font-medium">Add Library</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
