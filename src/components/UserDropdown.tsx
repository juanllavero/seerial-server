import { useServerStore } from '@/context/server.context'
import { ChevronsUpDown } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import LazyImage from './ui/LazyImage'

function UserDropdown() {
  const user = useServerStore((state) => state.currentUser)

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={'ghost'}
          size="lg"
          className="flex w-45 justify-between gap-3 px-1 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <LazyImage src={user ? (user.avatar ?? '') : ''} rounded width={40} />
          <ChevronsUpDown className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="z-51 w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        side="bottom"
        sideOffset={0}
      >
        {/* Home */}
        {/* <DropdownMenuItem
          key={home.name}
          onClick={() => handleItemClick(home)}
          className="gap-2 p-2"
        >
          <div className="flex size-6 items-center justify-center">
            <home.logo className="size-4 shrink-0" />
          </div>
          {home.name}
        </DropdownMenuItem> */}

        {/* Libraries List */}
        {/* {libraries && libraries.length > 0 && (
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
        <DropdownMenuSeparator /> */}

        {/* Add Library Button */}
        {/* <DropdownMenuItem
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
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserDropdown
