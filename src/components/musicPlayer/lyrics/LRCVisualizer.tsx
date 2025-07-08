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

const LRCVisualizer = () => {
  const { t } = useTranslation()
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
  const containerRef = useRef<HTMLDivElement>(null)
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
    const parseLrc = (content: string): LRCLine[] => {
      const lines = content.split(/\r\n?|\n/)
      const lrcLines: LRCLine[] = []

      lines.forEach((line) => {
        const trimmedLine = line.trim()
        if (!trimmedLine) return // Ommit empty lines

        // Check if it is a metadata line
        const metadataMatch = trimmedLine.match(/^\[([a-zA-Z]+):(.*)\]$/)
        if (metadataMatch) {
          return
        }

        // Check if the line matches the pattern
        const timeMatch = trimmedLine.match(
          /\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)/,
        )
        if (timeMatch) {
          const minutes = parseInt(timeMatch[1])
          const seconds = parseInt(timeMatch[2])
          const milliseconds = parseInt(timeMatch[3].padEnd(3, '0'))
          const time = minutes * 60 + seconds + milliseconds / 1000
          const text = timeMatch[4].trim()

          lrcLines.push({
            time,
            text: text || '♪',
            originalLine: line,
          })
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

  useEffect(() => {
    if (!isUserScrolling && containerRef.current && lines.length > 0) {
      const container = containerRef.current
      const currentLineElement = container.children[1]?.children[
        currentLineIndex
      ] as HTMLElement
      if (!currentLineElement) return

      const lineHeight = currentLineElement.offsetHeight
      const containerHeight = container.clientHeight
      const targetScrollTop =
        currentLineElement.offsetTop - containerHeight / 2 + lineHeight / 2

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      })
    }
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

  const handleLineClick = (time: number) => {
    seekTo(time)
  }

  const getLineOpacity = (index: number): string => {
    const distance = Math.abs(index - currentLineIndex)
    if (distance === 0) return 'opacity-100'
    if (distance === 1) return 'opacity-70'
    if (distance === 2) return 'opacity-50'
    if (distance <= 4) return 'opacity-30'
    return 'opacity-20'
  }

  const getLineScale = (index: number): string => {
    return index === currentLineIndex ? 'scale-105' : 'scale-100'
  }

  const capitalize = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  if (isLoading) return <Loading />

  return (
    <div className="p-x-[0.5rem] @container flex h-full w-full flex-col gap-1 overflow-y-auto rounded-lg">
      <div
        ref={containerRef}
        className="no-scrollbar w-full overflow-x-hidden overflow-y-auto px-6 py-8"
        onScroll={handleScroll}
      >
        <div className="absolute z-200 mt-20 flex flex-col gap-2 rounded-xl bg-black/50 p-5">
          {lyrics && lyrics.length > 1 && (
            <>
              <span className="text-xl font-black">{t('languageText')}</span>
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
                    <SelectItem key={lrcFile.language} value={lrcFile.language}>
                      {capitalize(
                        getLanguageName(lrcFile.language, i18next.language) ??
                          '',
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
        <div className="space-y-4">
          {lyrics && lyrics.length > 1 ? (
            lines.map((line, index) => {
              const isCurrentLine = index === currentLineIndex

              const lineClasses = isCurrentLine
                ? 'text-2xl @lg:text-4xl @2xl:text-5xl text-white'
                : 'text-xl @lg:text-3xl @2xl:text-4xl text-gray-400'

              return (
                <div key={index} className={`rounded-lg px-4 py-2 text-center`}>
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
            <div className="flex h-screen w-full items-center justify-center">
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
