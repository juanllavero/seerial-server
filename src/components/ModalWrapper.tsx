import React, { ReactNode, useState } from 'react'
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

interface TabContent {
  title: string
  content: ReactNode | ReactNode[]
}

interface ModalWrapperProps {
  title: string
  hideButtons?: boolean
  tabs: TabContent[]
  button: ReactNode
}

export function ModalWrapper({
  title,
  tabs,
  hideButtons,
  button,
}: ModalWrapperProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {tabs && tabs.length > 1 ? (
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={() => setOpen(false)}>Aceptar</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
