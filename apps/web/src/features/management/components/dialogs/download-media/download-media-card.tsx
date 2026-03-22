import type { MediaSearchResult } from '@seerial/domain';
import { useWebSocketStore } from '@seerial/stores';
import { AlertCircle, Download, Play } from 'lucide-react';
import { shallow } from 'zustand/shallow';
import { formatTime } from '@/shared/lib/react-utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';

interface DownloadMediaCardProps {
  result: MediaSearchResult;
  playMedia: (result: MediaSearchResult) => void;
  downloadMedia: (result: MediaSearchResult) => void;
}

function DownloadMediaCard({ result, playMedia, downloadMedia }: DownloadMediaCardProps) {
  const { downloading, errorDownloading, downloadPercentage, downloadingElementId } =
    useWebSocketStore(
      (state) => ({
        downloading: state.downloading,
        errorDownloading: state.errorDownloading,
        downloadPercentage: state.downloadPercentage,
        downloadingElementId: state.downloadingElementId,
      }),
      shallow,
    );

  const getDownloadButtonContent = () => {
    if (downloading && downloadingElementId === result.id) {
      return (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span className="text-sm">{Math.round(downloadPercentage)}%</span>
        </div>
      );
    } else if (errorDownloading && downloadingElementId === result.id) {
      return <AlertCircle className="h-4 w-4" />;
    }

    return <Download className="h-4 w-4" />;
  };

  const getDownloadButtonClass = () => {
    if (downloading && downloadingElementId === result.id) {
      return 'bg-blue-500 hover:bg-blue-600';
    } else if (errorDownloading) {
      return 'bg-red-500 hover:bg-red-600';
    }

    return 'bg-gray-500 hover:bg-gray-600';
  };

  return (
    <Card className="w-full transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <button
            type="button"
            className="relative shrink-0 cursor-pointer"
            onClick={() => playMedia(result)}
          >
            <img
              src={result.thumbnail}
              alt={result.title}
              className="h-18 w-32 rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTI4IDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjkwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNTIgMzJMNzYgNDVMNTIgNThWMzJaIiBmaWxsPSIjOUM5Q0EwIi8+Cjwvc3ZnPgo=';
              }}
            />
            <div className="bg-opacity-30 absolute inset-0 flex items-center justify-center rounded-lg bg-black opacity-0 transition-opacity hover:opacity-100">
              <Play className="h-8 w-8 text-white" />
            </div>
            <Badge className="bg-opacity-70 absolute right-1 bottom-1 bg-black text-xs text-white hover:bg-transparent">
              <span>{formatTime(result.duration)}</span>
            </Badge>
          </button>

          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => playMedia(result)}>
              <h3 className="mb-2 line-clamp-2 cursor-pointer text-sm leading-5 font-medium transition-colors hover:text-blue-600">
                {result.title}
              </h3>
            </button>

            <div className="mt-3 flex items-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => playMedia(result)}
                  className="h-8 px-3"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Ver
                </Button>

                <Button
                  size="sm"
                  onClick={() => downloadMedia(result)}
                  disabled={downloading}
                  className={`h-8 px-3 text-white ${getDownloadButtonClass()}`}
                >
                  {getDownloadButtonContent()}
                </Button>
              </div>
            </div>

            {downloading && downloadingElementId === result.id && (
              <div className="mt-2">
                <Progress value={downloadPercentage} className="h-1" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DownloadMediaCard;
