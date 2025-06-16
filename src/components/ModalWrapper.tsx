import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from './hooks/use-mobile'
import { useIsTablet } from './hooks/use-tablet'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer'
import FlexBox from './ui/FlexBox'

interface TabContent {
  title: string
  disabled?: boolean
  hidden?: boolean
  content: ReactNode | ReactNode[]
}

interface ModalWrapperProps {
  title: string
  hideButtons?: boolean
  tabs: TabContent[]
  button?: ReactNode
  isOpen?: boolean
  close?: () => void
  onAccept?: () => void
  openDialog?: () => void
  activeTab?: string
  width?: string
  onTabChange?: (tab: string) => void
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
  width = 'auto',
}: ModalWrapperProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const dialogRef = React.useRef(null)
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()

  const [internalActiveTab, setInternalActiveTab] = React.useState(
    tabs[0]?.title || 'tab1',
  )
  const currentTab = activeTab !== undefined ? activeTab : internalActiveTab

  const handleTabChange = (newTab: string) => {
    if (onTabChange) {
      onTabChange(newTab)
    }

    if (activeTab === undefined) {
      setInternalActiveTab(newTab)
    }
  }

  if (isTablet || isMobile) {
    return (
      <Drawer
        open={isOpen ?? open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen)
          if (newOpen && openDialog) {
            openDialog()
          } else if (!newOpen && close) {
            close()
          }
        }}
      >
        {button && <DrawerTrigger asChild>{button}</DrawerTrigger>}
        <DrawerContent ref={dialogRef}>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          {tabs && tabs.length > 1 ? (
            <Tabs
              value={currentTab} // Controlar la tab activa
              onValueChange={handleTabChange} // Manejar cambios de tab
              className="w-full"
            >
              <TabsList className={`mt-2 flex w-full`}>
                {tabs
                  .filter((tab) => !tab.hidden)
                  .map((tab) => (
                    <TabsTrigger
                      key={'Tab' + tab.title}
                      value={tab.title}
                      disabled={tab.disabled}
                    >
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
                    className="py-4"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    {Array.isArray(tab.content)
                      ? tab.content.map((item, index) => (
                          <div key={index}>{item}</div>
                        ))
                      : tab.content}
                  </TabsContent>
                ))}
            </Tabs>
          ) : tabs && tabs.length === 1 ? (
            <div className="w-full">{tabs[0]?.content ?? <></>}</div>
          ) : null}
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
                      close()
                    } else {
                      setOpen(false)
                    }
                  }}
                >
                  {t('cancelButton')}
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (onAccept) {
                      onAccept()
                    }

                    if (close) {
                      close()
                    } else {
                      setOpen(false)
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
    )
  }
  return (
    <Dialog
      open={isOpen ?? open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (newOpen && openDialog) {
          openDialog()
        } else if (!newOpen && close) {
          close()
        }
      }}
    >
      {button && <DialogTrigger asChild>{button}</DialogTrigger>}
      <DialogContent ref={dialogRef} className="h-fit w-fit">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {tabs && tabs.length > 1 ? (
          <Tabs
            value={currentTab} // Controlar la tab activa
            onValueChange={handleTabChange} // Manejar cambios de tab
            className="w-full"
          >
            <TabsList className={`mt-2 flex w-full`}>
              {tabs
                .filter((tab) => !tab.hidden)
                .map((tab) => (
                  <TabsTrigger
                    key={'Tab' + tab.title}
                    value={tab.title}
                    disabled={tab.disabled}
                  >
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
                  className="py-4"
                  style={{
                    width: width,
                    justifyContent: 'left',
                  }}
                >
                  {Array.isArray(tab.content)
                    ? tab.content.map((item, index) => (
                        <div key={index}>{item}</div>
                      ))
                    : tab.content}
                </TabsContent>
              ))}
          </Tabs>
        ) : tabs && tabs.length === 1 ? (
          <div className="w-full">{tabs[0]?.content ?? <></>}</div>
        ) : null}
        {!hideButtons && (
          <DialogFooter className="pt-0">
            <Button
              variant="outline"
              onClick={() => {
                if (close) {
                  close()
                } else {
                  setOpen(false)
                }
              }}
            >
              {t('cancelButton')}
            </Button>
            <Button
              onClick={() => {
                if (onAccept) {
                  onAccept()
                }

                if (close) {
                  close()
                } else {
                  setOpen(false)
                }
              }}
            >
              {t('saveButton')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
