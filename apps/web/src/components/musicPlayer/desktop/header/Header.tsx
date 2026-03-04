import { Button } from '@/components/ui/button'
import useMusicStore from '@/context/music.context'
import { Minimize2 } from 'lucide-react'

function MusicPlayerHeader() {
  const setIsExpanded = useMusicStore((state) => state.setIsExpanded)
  return (
    <div
      className={`fixed z-100 flex h-18 w-full translate-y-0 items-center justify-end p-6 opacity-100 transition-all duration-500`}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsExpanded(false)}
        className="text-white hover:bg-white/20"
      >
        <Minimize2 className="h-6 w-6" />
      </Button>
    </div>
  )
}

export default MusicPlayerHeader
