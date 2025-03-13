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
import React, { ReactNode, useState } from 'react'

interface TabContent {
  title: string
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
}

export function ModalWrapper({
  title,
  tabs,
  hideButtons,
  button,
  isOpen,
  close,
  openDialog,
}: ModalWrapperProps) {
  const [open, setOpen] = useState(false)
  const dialogRef = React.useRef(null)

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
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList className="mt-2 grid w-full grid-cols-3">
              {tabs.map((tab) => (
                <TabsTrigger key={'Tab' + tab.title} value={tab.title}>
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
