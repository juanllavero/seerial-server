import useMusicStore from '@/context/music.context'
import { useServerStore } from '@/context/server.context'
import { LRCLine } from '@/data/interfaces/Music'
import { useState, useEffect, useRef, memo } from 'react'

const LRCVisualizer = () => {
  const { selectedServer } = useServerStore()
  const { currentSong, currentTime, setCurrentTime } = useMusicStore()
  const [lines, setLines] = useState<LRCLine[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get LRC Lyrics if exists
  //   const { data: lyrics, isLoading } = useSWR(
  //     selectedServer && currentSong
  //       ? `https://${selectedServer.ip}/lyrics/id=${currentSong.id}`
  //       : null,
  //     fetcher,
  //   )

  const lyrics = `[ar:Dio]
[ti:Holy Diver]
[al:Holy Diver]
[length:05:40.69]
[by:Hechmanic]
[re:www.megalobiz.com/lrc/maker]
[ve:v1.2.3]

[00:12.50]Holy Diver
[00:16.80]You've been down too long in the midnight sea
[00:21.20]Oh what's becoming of me
[00:25.60]Ride the tiger
[00:30.10]You can see his stripes but you know he's clean
[00:34.40]Oh don't you see what I mean
[00:38.70]♪
[00:43.10]Gotta get away
[00:47.50]Holy Diver
[00:52.00]Sole survivor
[00:56.30]You're the one who's clean
[01:00.60]♪
[01:05.00]Shiny diamonds
[01:09.40]Like the eyes of a cat in the black and blue
[01:13.80]Something is coming for you
[01:18.20]Race for the morning
[01:22.50]You can hide in the sun 'till you see the light
[01:26.90]Oh we will pray it's all right
[01:31.30]♪
[01:35.70]Gotta get away
[01:40.10]Get away
[01:44.40]Holy Diver, yeah
[01:48.80]Sole survivor
[01:53.20]You're the one who's clean
[01:57.60]♪
[02:02.00]Between the velvet lies
[02:06.30]There's a truth that's hard as steel
[02:10.70]The vision never dies
[02:15.10]Life's a neverending wheel`

  const isLoading = false

  // Parse LRC content
  useEffect(() => {
    const parseLrc = (content: string): LRCLine[] => {
      const lines = content.split('\n')
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

    setLines(parseLrc(lyrics))
  }, [lyrics])

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
    setCurrentTime(time)
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

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-hidden overflow-y-auto px-6 py-8"
      onScroll={handleScroll}
    >
      <div className="space-y-4">
        {lines.map((line, index) => (
          <div
            key={index}
            className={`cursor-pointer text-center font-black transition-all duration-300 ease-out ${getLineOpacity(index)} ${getLineScale(index)} ${index === currentLineIndex ? 'text-4xl text-white' : 'text-3xl text-gray-300'} rounded-lg px-4 py-2 hover:text-white hover:opacity-100`}
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
