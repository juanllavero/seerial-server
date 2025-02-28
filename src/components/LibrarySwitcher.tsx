import * as React from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from './ui/button'

interface Item {
  name: string
  logo: React.ElementType
  action: () => void
}

export function LibrarySwitcher({ libraries }: { libraries: Item[] }) {
  const [activeItem, setActiveItem] = React.useState<Item>(libraries[0])

  const handleItemClick = (item: Item) => {
    setActiveItem(item)
    item.action()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={'ghost'}
          size="lg"
          className="flex w-45 justify-between gap-3 px-1"
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
        sideOffset={4}
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
        <DropdownMenuItem className="gap-2 p-2">
          <div className="bg-background flex size-6 items-center justify-center rounded-md border">
            <Plus className="size-4" />
          </div>
          <div className="text-muted-foreground font-medium">Add Library</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
