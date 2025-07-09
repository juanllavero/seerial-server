import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { LRCFile, LRCLine } from '@/data/interfaces/Music'
import { fetcher, getLanguageName } from '@/utils/utils'
import { useState, useEffect, useRef, memo } from 'react'
import useSWR from 'swr'
import Loading from '@/components/Loading'
import i18next from 'i18next'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { shallow } from 'zustand/shallow'
import { useIsMobile } from '@/components/hooks/use-mobile'

const LRCVisualizer = () => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const serverIP = useServerStore((state) => state.serverIP)
  const { currentSong, currentTime, isShown, seekTo } = useMusicStore(
    (state) => ({
      currentSong: state.currentSong,
      currentTime: state.currentTime,
      isShown: state.isShown,
      seekTo: state.seekTo,
    }),
    shallow,
  )
  const [selectedLRCFile, setSelectedLRCFile] = useState<LRCFile | null>(null)
  const [lines, setLines] = useState<LRCLine[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null) // Solo necesitamos esta ref
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { data: lyrics, isLoading } = useSWR<LRCFile[]>(
    serverIP !== '' && currentSong && isShown
      ? `http://${serverIP}/lyrics?id=${currentSong.id}`
      : null,
    fetcher,
  )

  useEffect(() => {
    if (lyrics && lyrics.length > 0) setSelectedLRCFile(lyrics[0])
  }, [lyrics])

  useEffect(() => {
    // ... (sin cambios en la función parseLrc)
    const parseLrc = (content: string): LRCLine[] => {
      const lines = content.split(/\r\n?|\n/)
      const lrcLines: LRCLine[] = []
      lines.forEach((line) => {
        const trimmedLine = line.trim()
        if (!trimmedLine) return
        const metadataMatch = trimmedLine.match(/^\[([a-zA-Z]+):(.*)\]$/)
        if (metadataMatch) {
          return
        }
        const timeMatch = trimmedLine.match(
          /\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)/,
        )
        if (timeMatch) {
          const minutes = parseInt(timeMatch[1])
          const seconds = parseInt(timeMatch[2])
          const milliseconds = parseInt(timeMatch[3].padEnd(3, '0'))
          const time = minutes * 60 + seconds + milliseconds / 1000
          const text = timeMatch[4].trim()
          lrcLines.push({ time, text: text || '♪', originalLine: line })
        }
      })
      return lrcLines.sort((a, b) => a.time - b.time)
    }

    if (selectedLRCFile) {
      setLines(parseLrc(selectedLRCFile.content))
    }
  }, [selectedLRCFile])

  useEffect(() => {
    let newCurrentIndex = 0
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].time) {
        newCurrentIndex = i
        break
      }
    }
    setCurrentLineIndex(newCurrentIndex)
  }, [currentTime, lines])

  // MODIFICADO: useEffect de scroll simplificado
  useEffect(() => {
    if (!isUserScrolling && containerRef.current && lines.length > 0) {
      const container = containerRef.current
      // El hijo directo de 'container' ahora es el que tiene los elementos de las letras
      const currentLineElement = container.children[0]?.children[
        currentLineIndex
      ] as HTMLElement

      if (!currentLineElement) return

      const lineHeight = currentLineElement.offsetHeight
      const containerHeight = container.clientHeight // Esto ahora es la altura completa

      const targetScrollTop =
        currentLineElement.offsetTop - containerHeight / 2 + lineHeight / 2

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      })
    }
    // Ya no necesitamos 'isMobile' como dependencia aquí
  }, [currentLineIndex, isUserScrolling, lines])

  const handleScroll = () => {
    setIsUserScrolling(true)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false)
    }, 2000)
  }

  // ... (sin cambios en handleLineClick, getLineOpacity, getLineScale, capitalize)
  const handleLineClick = (time: number) => seekTo(time)
  const getLineOpacity = (index: number) => {
    const distance = Math.abs(index - currentLineIndex)
    if (distance === 0) return 'opacity-100'
    if (distance === 1) return 'opacity-70'
    if (distance === 2) return 'opacity-50'
    if (distance <= 4) return 'opacity-30'
    return 'opacity-20'
  }
  const getLineScale = (index: number) =>
    index === currentLineIndex ? 'scale-105' : 'scale-100'
  const capitalize = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1)

  if (isLoading) return <Loading />

  return (
    // MODIFICADO: El contenedor principal ya no tiene ref ni overflow
    <div className="p-x-[0.5rem] @container flex h-full w-full flex-col gap-1 rounded-lg">
      {/* MODIFICADO: El contenedor de scroll ya no tiene padding vertical */}
      <div
        ref={containerRef}
        className="no-scrollbar w-full flex-grow overflow-x-hidden overflow-y-auto"
        onScroll={handleScroll}
      >
        {/* MODIFICADO: El contenido de las letras ahora está envuelto en un div con padding */}
        <div className="space-y-4 px-6 py-8">
          {!isMobile && (
            <div className="absolute z-200 mt-20 flex flex-col gap-2 rounded-xl bg-black/50 p-5">
              {lyrics && lyrics.length > 1 && (
                <>
                  <span className="text-xl font-black">
                    {t('languageText')}
                  </span>
                  <Select
                    value={selectedLRCFile?.language}
                    onValueChange={(value) => {
                      setSelectedLRCFile(
                        lyrics.find((l) => l.language === value) ?? null,
                      )
                    }}
                  >
                    <SelectTrigger className="w-fit min-w-40">
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {lyrics?.map((lrcFile) => (
                        <SelectItem
                          key={lrcFile.language}
                          value={lrcFile.language}
                        >
                          {capitalize(
                            getLanguageName(
                              lrcFile.language,
                              i18next.language,
                            ) ?? '',
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <Button variant={'secondary'}>
                <div className="flex gap-1">
                  <Plus />
                  {t('addLyrics')}
                </div>
              </Button>
            </div>
          )}
          {lyrics && lyrics.length > 1 ? (
            lines.map((line, index) => {
              const isCurrentLine = index === currentLineIndex
              const lineClasses = isCurrentLine
                ? 'text-2xl @lg:text-4xl @2xl:text-5xl text-white'
                : 'text-xl @lg:text-3xl @2xl:text-4xl text-gray-400'
              return (
                <div key={index} className="rounded-lg px-4 py-2 text-center">
                  <span
                    onClick={() => handleLineClick(line.time)}
                    className={`cursor-pointer font-black transition-all duration-300 ease-out ${getLineOpacity(index)} ${getLineScale(index)} ${lineClasses} hover:text-white hover:opacity-100`}
                  >
                    {line.text}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="flex h-full min-h-[300px] w-full items-center justify-center">
              <span className="text-center text-2xl font-bold">
                {t('lyricsNotFound')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(LRCVisualizer)
