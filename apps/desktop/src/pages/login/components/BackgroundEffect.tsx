import { memo } from 'react'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Film,
  Music,
  Tv,
  Radio,
  Headphones,
  Speaker,
  Mic,
  Camera,
  Video,
  Star,
  Heart,
  Download,
  Share,
  Shuffle,
  Repeat,
  FastForward,
  Rewind,
  Monitor,
  Smartphone,
  Tablet,
  Disc,
  Award,
  Trophy,
  Zap,
  Eye,
  ThumbsUp,
} from 'lucide-react'
import '@/styles/animations.css'
import { useIsMobile } from '@/components/hooks/use-mobile'

const BackgroundEffect = () => {
  const isMobile = useIsMobile()
  const mediaTexts = [
    'Play',
    'Pause',
    'Live',
    'Record',
    'Action',
    'Drama',
    'Comedy',
    'Horror',
    'Romance',
    'Thriller',
    'Series',
    'Movie',
    'Music',
    'Podcast',
    'Stream',
    'Playlist',
    'Album',
    'Artist',
    'Episode',
    'Season',
    'Rating',
    'Director',
    'Cast',
    'Genre',
    'Score',
    'Watchlist',
    'Continue',
  ]

  const MediaIcons = [
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Volume2,
    VolumeX,
    Film,
    Music,
    Tv,
    Radio,
    Headphones,
    Speaker,
    Mic,
    Camera,
    Video,
    Star,
    Heart,
    Download,
    Share,
    Shuffle,
    Repeat,
    FastForward,
    Rewind,
    Monitor,
    Smartphone,
    Tablet,
    Disc,
    Award,
    Trophy,
    Zap,
    Eye,
    ThumbsUp,
  ]

  // Responsive particle counts
  const getParticleCounts = () => {
    if (typeof window !== 'undefined') {
      return {
        main: isMobile ? 20 : 35,
        large: isMobile ? 8 : 15,
        special: isMobile ? 4 : 8,
      }
    }
    return { main: 35, large: 15, special: 8 }
  }

  const counts = getParticleCounts()

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Partículas principales con texto */}
      {[...Array(counts.main)].map((_, i) => (
        <div
          key={i}
          className="animate-float absolute animate-pulse font-medium capitalize select-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${25 + Math.random() * 10}s`,
            fontSize: `${10 + Math.random() * 6}px`,
            color: `rgba(255, 255, 255, ${0.15 + Math.random() * 0.25})`,
            fontFamily: 'sans-serif',
          }}
        >
          {mediaTexts[Math.floor(Math.random() * mediaTexts.length)]}
        </div>
      ))}

      {/* Partículas grandes con iconos */}
      {[...Array(counts.large)].map((_, i) => {
        const IconComponent =
          MediaIcons[Math.floor(Math.random() * MediaIcons.length)]
        return (
          <div
            key={`large-${i}`}
            className="animate-float-slow absolute animate-pulse select-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 12}s`,
              animationDuration: `${20 + Math.random() * 15}s`,
              color: `rgba(255, 255, 255, ${0.12 + Math.random() * 0.2})`,
            }}
          >
            <IconComponent size={14 + Math.random() * 8} />
          </div>
        )
      })}

      {/* Partículas especiales con texto destacado */}
      {[...Array(counts.special)].map((_, i) => (
        <div
          key={`special-${i}`}
          className="absolute animate-pulse font-semibold capitalize select-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${1.5 + Math.random() * 2}s`,
            fontSize: `${16 + Math.random() * 8}px`,
            color: `rgba(255, 255, 255, ${0.2 + Math.random() * 0.3})`,
            textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
            filter: 'blur(0.3px)',
          }}
        >
          {
            ['Movies', 'Shows', 'Videos', 'Music', 'Streaming', 'Collection'][
              Math.floor(Math.random() * 6)
            ]
          }
        </div>
      ))}

      {/* Partículas especiales con iconos destacados */}
      {[...Array(Math.floor(counts.special / 2))].map((_, i) => {
        const IconComponent = [Star, Heart, Award, Trophy, Zap][
          Math.floor(Math.random() * 5)
        ]
        return (
          <div
            key={`icon-special-${i}`}
            className="absolute animate-pulse select-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${1.8 + Math.random() * 2.5}s`,
              color: `rgba(255, 255, 255, ${0.25 + Math.random() * 0.25})`,
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))',
            }}
          >
            <IconComponent size={18 + Math.random() * 6} />
          </div>
        )
      })}
    </div>
  )
}

export default memo(BackgroundEffect)
