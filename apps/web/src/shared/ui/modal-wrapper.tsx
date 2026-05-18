import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useIsMobile } from '../hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';
import FlexBox from './flex-box';

interface TabContent {
  title: string;
  disabled?: boolean;
  hidden?: boolean;
  content: ReactNode | ReactNode[];
}

interface ModalWrapperProps {
  title: string;
  hideButtons?: boolean;
  tabs: TabContent[];
  button?: ReactNode;
  isOpen?: boolean;
  close?: () => void;
  onAccept?: () => void;
  openDialog?: () => void;
  activeTab?: string;
  width?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onTabChange?: (tab: string) => void;
}

export function ModalWrapper({
  title,
  tabs,
  hideButtons,
  button,
  isOpen,
  close,
  onAccept,
  openDialog,
  activeTab,
  onTabChange,
  size = 'lg',
}: ModalWrapperProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const dialogRef = React.useRef(null);
  const isMobile = useIsMobile();

  const [internalActiveTab, setInternalActiveTab] = React.useState(tabs[0]?.title || 'tab1');
  const currentTab = activeTab === undefined ? internalActiveTab : activeTab;

  const handleTabChange = (newTab: string) => {
    if (onTabChange) {
      onTabChange(newTab);
    }

    if (activeTab === undefined) {
      setInternalActiveTab(newTab);
    }
  };

  const getWidthClassName = (size: string) => {
    if (isMobile) {
      return 'data-[vaul-drawer-direction=right]:w-full';
    }
    switch (size) {
      case 'sm':
        return 'data-[vaul-drawer-direction=right]:w-1/4';
      case 'md':
        return 'data-[vaul-drawer-direction=right]:w-1/3';
      case 'lg':
        return 'data-[vaul-drawer-direction=right]:w-1/2';
      case 'xl':
        return 'data-[vaul-drawer-direction=right]:w-3/4';
      case 'full':
        return 'data-[vaul-drawer-direction=right]:w-full';
      default:
        return 'data-[vaul-drawer-direction=right]:w-1/2';
    }
  };

  return (
    <Drawer
      open={isOpen ?? open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (newOpen && openDialog) {
          openDialog();
        } else if (!newOpen && close) {
          close();
        }
      }}
      direction="right"
    >
      {button && <DrawerTrigger asChild>{button}</DrawerTrigger>}
      <DrawerContent ref={dialogRef} widthClassName={getWidthClassName(size)}>
        <DrawerHeader>
          <DrawerTitle className="text-2xl">{title}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 min-h-0 flex flex-col">
          {tabs && tabs.length > 1 ? (
            <Tabs
              value={currentTab}
              onValueChange={handleTabChange}
              className="flex flex-col flex-1 min-h-0"
            >
              <TabsList className="m-2 flex shrink-0">
                {tabs
                  .filter((tab) => !tab.hidden)
                  .map((tab) => (
                    <TabsTrigger key={`Tab${tab.title}`} value={tab.title} disabled={tab.disabled}>
                      {tab.title}
                    </TabsTrigger>
                  ))}
              </TabsList>
              {tabs
                .filter((tab) => !tab.hidden)
                .map((tab) => (
                  <TabsContent
                    key={tab.title}
                    value={tab.title}
                    className="p-4 flex-1 min-h-0 overflow-y-auto"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    {Array.isArray(tab.content)
                      ? tab.content.map((item) => <div key={tab.title}>{item}</div>)
                      : tab.content}
                  </TabsContent>
                ))}
            </Tabs>
          ) : tabs && tabs.length === 1 ? (
            <div className="w-full flex-1 min-h-0 overflow-y-auto">{tabs[0]?.content}</div>
          ) : null}
        </div>
        {!hideButtons && (
          <DrawerFooter className="pt-0">
            <FlexBox
              direction={isMobile ? 'column' : 'row'}
              gap={isMobile ? 0.5 : 1}
              width={'100%'}
            >
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (close) {
                    close();
                  } else {
                    setOpen(false);
                  }
                }}
              >
                {t('cancelButton')}
              </Button>
              <Button
                className="w-full"
                onClick={() => {
                  if (onAccept) {
                    onAccept();
                  }

                  if (close) {
                    close();
                  } else {
                    setOpen(false);
                  }
                }}
              >
                {t('saveButton')}
              </Button>
            </FlexBox>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
