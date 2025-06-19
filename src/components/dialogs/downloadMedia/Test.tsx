import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Play,
  Search,
  X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'

export interface MediaSearchResult {
  id: string
  title: string
  url: string
  duration: number
  thumbnail: string
}

type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'error'

interface VideoDownloadState {
  status: DownloadStatus
  progress: number
}

const MOCK_VIDEOS: MediaSearchResult[] = [
  {
    id: '1',
    title: 'Cómo programar en React - Tutorial completo para principiantes',
    url: 'https://youtube.com/watch?v=1',
    duration: 3600,
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  },
  {
    id: '2',
    title: 'TypeScript en 30 minutos - Guía práctica',
    url: 'https://youtube.com/watch?v=2',
    duration: 1800,
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  },
  {
    id: '3',
    title: 'Diseño UI/UX moderno con Tailwind CSS',
    url: 'https://youtube.com/watch?v=3',
    duration: 2700,
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  },
  {
    id: '4',
    title: 'Arquitectura de software clean - Principios SOLID',
    url: 'https://youtube.com/watch?v=4',
    duration: 4200,
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  },
  {
    id: '5',
    title: 'JavaScript ES2024 - Nuevas características',
    url: 'https://youtube.com/watch?v=5',
    duration: 1500,
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  },
  {
    id: '6',
    title: 'Base de datos NoSQL vs SQL - Cuándo usar cada una',
    url: 'https://youtube.com/watch?v=6',
    duration: 2400,
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  },
  {
    id: '7',
    title: 'Docker y Kubernetes para desarrolladores',
    url: 'https://youtube.com/watch?v=7',
    duration: 5400,
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  },
  {
    id: '8',
    title: 'API REST con Node.js y Express',
    url: 'https://youtube.com/watch?v=8',
    duration: 3300,
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  },
]

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const VideoSkeleton = () => (
  <Card className="w-full">
    <CardContent className="p-4">
      <div className="flex gap-4">
        <div className="relative flex-shrink-0">
          <div className="h-24 w-32 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </CardContent>
  </Card>
)

const VideoCard = ({
  video,
  onPlay,
  onDownload,
  downloadState,
}: {
  video: MediaSearchResult
  onPlay: (video: MediaSearchResult) => void
  onDownload: (video: MediaSearchResult) => void
  downloadState: VideoDownloadState
}) => {
  const getDownloadButtonContent = () => {
    switch (downloadState.status) {
      case 'downloading':
        return (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="text-sm">
              {Math.round(downloadState.progress)}%
            </span>
          </div>
        )
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Download className="h-4 w-4" />
    }
  }

  const getDownloadButtonClass = () => {
    switch (downloadState.status) {
      case 'downloading':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'completed':
        return 'bg-green-500 hover:bg-green-600'
      case 'error':
        return 'bg-red-500 hover:bg-red-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  return (
    <Card className="w-full transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div
            className="relative flex-shrink-0 cursor-pointer"
            onClick={() => onPlay(video)}
          >
            <img
              src={video.thumbnail}
              alt={video.title}
              className="h-24 w-32 rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTI4IDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjkwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNTIgMzJMNzYgNDVMNTIgNThWMzJaIiBmaWxsPSIjOUM5Q0EwIi8+Cjwvc3ZnPgo='
              }}
            />
            <div className="bg-opacity-30 absolute inset-0 flex items-center justify-center rounded-lg bg-black opacity-0 transition-opacity hover:opacity-100">
              <Play className="h-8 w-8 text-white" />
            </div>
            <Badge className="bg-opacity-70 absolute right-1 bottom-1 bg-black text-xs text-white">
              <Clock className="mr-1 h-3 w-3" />
              {formatDuration(video.duration)}
            </Badge>
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="mb-2 line-clamp-2 cursor-pointer text-sm leading-5 font-medium transition-colors hover:text-blue-600"
              onClick={() => onPlay(video)}
            >
              {video.title}
            </h3>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Duración: {formatDuration(video.duration)}
              </span>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPlay(video)}
                  className="h-8 px-3"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Ver
                </Button>

                <Button
                  size="sm"
                  onClick={() => onDownload(video)}
                  disabled={
                    downloadState.status === 'downloading' ||
                    downloadState.status === 'completed'
                  }
                  className={`h-8 px-3 text-white ${getDownloadButtonClass()}`}
                >
                  {getDownloadButtonContent()}
                </Button>
              </div>
            </div>

            {downloadState.status === 'downloading' && (
              <div className="mt-2">
                <Progress value={downloadState.progress} className="h-1" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const VideoPlayer = ({
  video,
  onClose,
}: {
  video: MediaSearchResult
  onClose: () => void
}) => (
  <div className="bg-opacity-90 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
    <div className="relative w-full max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="hover:bg-opacity-20 absolute -top-12 right-0 text-white hover:bg-white"
      >
        <X className="h-5 w-5" />
      </Button>

      <div className="overflow-hidden rounded-lg bg-gray-800">
        <div className="flex aspect-video items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <Play className="mx-auto mb-4 h-16 w-16 opacity-50" />
            <p className="mb-2 text-lg">Vista previa del video</p>
            <p className="text-sm opacity-75">{video.title}</p>
          </div>
        </div>

        <div className="p-4">
          <h3 className="mb-2 font-medium text-white">{video.title}</h3>
          <p className="text-sm text-gray-300">
            Duración: {formatDuration(video.duration)}
          </p>
        </div>
      </div>
    </div>
  </div>
)

export default function YouTubeSearchModal() {
  const [isOpen, setIsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaSearchResult[]>([])
  const [downloadStates, setDownloadStates] = useState<
    Record<string, VideoDownloadState>
  >({})
  const [playingVideo, setPlayingVideo] = useState<MediaSearchResult | null>(
    null,
  )

  const simulateSearch = async (query: string) => {
    setIsSearching(true)

    // Simular tiempo de búsqueda
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Filtrar videos basado en la búsqueda
    const filteredVideos = MOCK_VIDEOS.filter(
      (video) =>
        video.title.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes('react') ||
        query.toLowerCase().includes('javascript') ||
        query.toLowerCase().includes('typescript') ||
        query === '',
    )

    setSearchResults(filteredVideos)
    setIsSearching(false)
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      simulateSearch(searchQuery)
    } else {
      simulateSearch('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const simulateDownload = async (videoId: string) => {
    setDownloadStates((prev) => ({
      ...prev,
      [videoId]: { status: 'downloading', progress: 0 },
    }))

    // Simular progreso de descarga
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))

      setDownloadStates((prev) => ({
        ...prev,
        [videoId]: { status: 'downloading', progress },
      }))
    }

    // Finalizar descarga
    setDownloadStates((prev) => ({
      ...prev,
      [videoId]: { status: 'completed', progress: 100 },
    }))

    // Cerrar modal después de 1 segundo
    setTimeout(() => {
      setIsOpen(false)
    }, 1000)
  }

  const handleDownload = (video: MediaSearchResult) => {
    simulateDownload(video.id)
  }

  const handlePlay = (video: MediaSearchResult) => {
    setPlayingVideo(video)
  }

  // Cargar videos iniciales
  useEffect(() => {
    simulateSearch('')
  }, [])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-semibold">
              Buscar Videos de YouTube
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-4">
            {/* Buscador */}
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Buscar videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Lista de resultados */}
            <div className="h-96 space-y-3 overflow-y-auto pr-2">
              {isSearching ? (
                // Skeletons
                Array.from({ length: 4 }).map((_, index) => (
                  <VideoSkeleton key={index} />
                ))
              ) : searchResults.length > 0 ? (
                // Resultados
                searchResults.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onPlay={handlePlay}
                    onDownload={handleDownload}
                    downloadState={
                      downloadStates[video.id] || {
                        status: 'idle',
                        progress: 0,
                      }
                    }
                  />
                ))
              ) : (
                // Sin resultados
                <div className="flex h-full flex-col items-center justify-center text-gray-500">
                  <Search className="mb-4 h-12 w-12 opacity-50" />
                  <p>No se encontraron videos</p>
                  <p className="text-sm">
                    Intenta con otros términos de búsqueda
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reproductor de video */}
      {playingVideo && (
        <VideoPlayer
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />
      )}

      {/* Botón para abrir modal (solo para demo) */}
      {!isOpen && (
        <div className="fixed right-4 bottom-4">
          <Button onClick={() => setIsOpen(true)}>Abrir Buscador</Button>
        </div>
      )}
    </>
  )
}
