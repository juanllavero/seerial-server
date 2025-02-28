import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { DropdownContent } from '@/data/interfaces/Utils'

interface DropdownWrapperProps {
  content: DropdownContent
  width?: string
  button: React.ReactNode
}

function DropdownWrapper({
  content,
  button,
  width = 'w-56',
}: DropdownWrapperProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
      <DropdownMenuContent className={width}>
        {/* Title */}
        {content.title && (
          <>
            <DropdownMenuLabel>{content.title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Items Groups */}
        {content.items.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            <DropdownMenuGroup>
              {group.items.map((item, itemIndex) =>
                item.items ? (
                  <DropdownMenuSub key={itemIndex}>
                    <DropdownMenuSubTrigger disabled={item.disabled}>
                      {item.title}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {item.items.map((subGroup, subGroupIndex) => (
                          <React.Fragment key={subGroupIndex}>
                            {subGroup.items.map((subItem, subItemIndex) => (
                              <DropdownMenuItem
                                key={subItemIndex}
                                onClick={subItem.action}
                                disabled={subItem.disabled}
                              >
                                {subItem.title}
                                {subItem.shortcut && (
                                  <DropdownMenuShortcut>
                                    {subItem.shortcut}
                                  </DropdownMenuShortcut>
                                )}
                              </DropdownMenuItem>
                            ))}
                            {subGroup.separator && <DropdownMenuSeparator />}
                          </React.Fragment>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                ) : (
                  <DropdownMenuItem
                    key={itemIndex}
                    onClick={item.action}
                    disabled={item.disabled}
                  >
                    {item.title}
                    {item.shortcut && (
                      <DropdownMenuShortcut>
                        {item.shortcut}
                      </DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuGroup>
            {group.separator && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownWrapper
