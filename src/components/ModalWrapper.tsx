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

interface TabContent {
  title: string
  disabled?: boolean
  content: ReactNode | ReactNode[]
}

interface ModalWrapperProps {
  title: string
  hideButtons?: boolean
  tabs: TabContent[]
  button?: ReactNode
  isOpen?: boolean
  close?: () => void
  openDialog?: () => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function ModalWrapper({
  title,
  tabs,
  hideButtons,
  button,
  isOpen,
  close,
  openDialog,
  activeTab,
  onTabChange,
}: ModalWrapperProps) {
  const [open, setOpen] = React.useState(false)
  const dialogRef = React.useRef(null)

  const [internalActiveTab, setInternalActiveTab] = React.useState(tabs[0]?.title || 'tab1')
  const currentTab = activeTab !== undefined ? activeTab : internalActiveTab

  const handleTabChange = (newTab: string) => {
    if (onTabChange) {
      onTabChange(newTab)
    }

    if (activeTab === undefined) {
      setInternalActiveTab(newTab)
    }
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
            <TabsList className="mt-2 grid w-full grid-cols-3">
              {tabs.map((tab) => (
                <TabsTrigger key={'Tab' + tab.title} value={tab.title} disabled={tab.disabled}>
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.title} value={tab.title} className="py-4">
                {Array.isArray(tab.content)
                  ? tab.content.map((item, index) => (
                      <div key={index}>{item}</div>
                    ))
                  : tab.content}
              </TabsContent>
            ))}
          </Tabs>
        ) : tabs && tabs.length === 1 ? (
          <div>{tabs[0]?.content ?? <></>}</div>
        ) : null}
        {!hideButtons && (
          <DialogFooter>
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
              Cerrar
            </Button>
            <Button
              onClick={() => {
                if (close) {
                  close()
                } else {
                  setOpen(false)
                }
              }}
            >
              Aceptar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}