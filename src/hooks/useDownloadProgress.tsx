import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useWebSocketStore } from '@/context/ws.context'
import { Download } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

interface UseDownloadProgressOptions {
  onComplete?: () => void
  onError?: (error: string) => void
  onCancel?: () => void
  showCancelButton?: boolean
  title?: string
}

export function useDownloadProgress(options: UseDownloadProgressOptions = {}) {
  const { t } = useTranslation()
  const { downloadPercentage, downloading, errorDownloading } =
    useWebSocketStore()

  const ProgressOverlay = () => {
    if (!downloading) return null

    const overlayContent = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Progress Card */}
        <Card className="relative z-10 mx-4 w-96 border-2 shadow-2xl">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="text-primary h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  {options.title || t('downloading', 'Downloading...')}
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              <Progress
                value={downloadPercentage}
                className="h-3 w-full"
                aria-label="Download progress"
              />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {errorDownloading ? t('errorDownloading') : t('downloading')}
                </span>
                <span className="font-mono font-medium">
                  {Math.round(downloadPercentage)}%
                </span>
              </div>

              {errorDownloading && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={hideProgress}
                    className="flex-1"
                  >
                    {t('close', 'Close')}
                  </Button>
                </div>
              )}

              {state.isComplete && (
                <div className="text-center font-medium text-green-600">
                  ✓ {t('downloadComplete', 'Download Complete!')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )

    return createPortal(overlayContent, document.body)
  }

  return {
    ProgressOverlay,
    showProgress,
    hideProgress,
    cancelDownload,
    isVisible: state.isVisible,
    progress: state.progress,
    isComplete: state.isComplete,
    hasError: state.hasError,
  }
}
