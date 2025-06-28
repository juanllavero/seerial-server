import { Button } from '@/components/ui/button'
import useMusicStore from '@/context/music.context'
import { Minimize2 } from 'lucide-react'

function MusicPlayerHeader() {
  const { isExpanded, setIsExpanded } = useMusicStore()
  return (
    <div
      className={`fixed z-100 flex items-center justify-end p-6 transition-all duration-500 ${
        isExpanded
          ? 'h-18 w-full translate-y-0 opacity-100'
          : 'transform-translate-y-4 pointer-events-none absolute opacity-0 transition-none'
      }`}
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
