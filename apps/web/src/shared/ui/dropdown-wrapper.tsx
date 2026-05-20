/** biome-ignore-all lint/suspicious/noArrayIndexKey: <TODO> */
/** biome-ignore-all assist/source/organizeImports: <TODO> */

import type { DropdownContent } from '@seerial/domain';
import React from 'react';
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
} from './dropdown-menu';

interface DropdownWrapperProps {
  onOpenChange?: (open: boolean) => void;
  content: DropdownContent;
  width?: string;
  button: React.ReactNode;
}

function DropdownWrapper({ onOpenChange, content, button, width = 'w-56' }: DropdownWrapperProps) {
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        onOpenChange?.(open);
      }}
    >
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
          <React.Fragment key={`Group${groupIndex}`}>
            <DropdownMenuGroup>
              {group.items.map((item, itemIndex) =>
                item.items ? (
                  item.hidden ? null : (
                    <DropdownMenuSub key={`Sub${itemIndex}`}>
                      <DropdownMenuSubTrigger disabled={item.hidden}>
                        {item.title}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {item.items.map((subGroup, subGroupIndex) => (
                            <React.Fragment key={`SubGroup${subGroupIndex}`}>
                              {subGroup.items.map((subItem, subItemIndex) => (
                                <DropdownMenuItem
                                  key={`SubItem${subItemIndex}`}
                                  onClick={subItem.action}
                                >
                                  {subItem.title}
                                  {subItem.shortcut && (
                                    <DropdownMenuShortcut>{subItem.shortcut}</DropdownMenuShortcut>
                                  )}
                                </DropdownMenuItem>
                              ))}
                              {subGroup.separator && <DropdownMenuSeparator />}
                            </React.Fragment>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )
                ) : item.hidden ? null : (
                  <DropdownMenuItem key={itemIndex} onClick={item.action}>
                    {item.title}
                    {item.shortcut && <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuGroup>
            {group.separator && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DropdownWrapper;
