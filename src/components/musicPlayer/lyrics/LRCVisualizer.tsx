import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { LRCFile, LRCLine } from '@/data/interfaces/Music'
import { fetcher } from '@/utils/utils'
import { useState, useEffect, useRef, memo } from 'react'
import useSWR from 'swr'
import Loading from '@/components/Loading'

const LRCVisualizer = () => {
  const { selectedServer } = useServerStore()
  const { currentSong, currentTime, seekTo } = useMusicStore()
  const [selectedLRCFile, setSelectedLRCFile] = useState<LRCFile | null>(null)
  const [lines, setLines] = useState<LRCLine[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get LRC Lyrics if exists
  const { data: lyrics, isLoading } = useSWR<LRCFile[]>(
    selectedServer && currentSong
      ? `https://${selectedServer.ip}/lyrics?id=${currentSong.id}`
      : null,
    fetcher,
  )

  useEffect(() => {
    if (lyrics && lyrics.length > 0) setSelectedLRCFile(lyrics[0])
  }, [lyrics])

  // Parse LRC content
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
        // If no pattern matches, ignore the line
      })

      return lrcLines.sort((a, b) => a.time - b.time)
    }

    if (selectedLRCFile) {
      setLines(parseLrc(selectedLRCFile.content))
    }
  }, [selectedLRCFile])

  // Find current line
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

  // Auto-scroll when the current line changes (only if the user is not scrolling)
  useEffect(() => {
    if (!isUserScrolling && containerRef.current && lines.length > 0) {
      const container = containerRef.current
      const lineHeight = 60 // aproximated line height
      const containerHeight = container.clientHeight
      const targetScrollTop =
        currentLineIndex * lineHeight - containerHeight / 2 + lineHeight / 2

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      })
    }
  }, [currentLineIndex, isUserScrolling, lines])

  const handleScroll = () => {
    setIsUserScrolling(true)

    // Reset flag when user stops scrolling
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

  if (!lyrics || isLoading) return <Loading />

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-hidden overflow-y-auto px-6 py-8"
      onScroll={handleScroll}
    >
      <select
        className="absolute z-100 mb-4 w-fit rounded-lg border-2 border-gray-300 p-2 text-lg"
        value={selectedLRCFile?.language}
        onChange={(e) =>
          setSelectedLRCFile(
            lyrics.find((l) => l.language === e.target.value) ?? null,
          )
        }
      >
        <option value="">Select a lyrics file</option>
        {lyrics?.map((lrcFile) => (
          <option key={lrcFile.language} value={lrcFile.language}>
            {lrcFile.language}
          </option>
        ))}
      </select>
      <div className="space-y-4">
        {lines.map((line, index) => (
          <div
            key={index}
            className={`cursor-pointer text-center font-black transition-all duration-300 ease-out ${getLineOpacity(index)} ${getLineScale(index)} ${index === currentLineIndex ? 'text-4xl text-white' : 'text-3xl text-gray-400'} rounded-lg px-4 py-2 hover:text-white hover:opacity-100`}
            onClick={() => handleLineClick(line.time)}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(LRCVisualizer)
