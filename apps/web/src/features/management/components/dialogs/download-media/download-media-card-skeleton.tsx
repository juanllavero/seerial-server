import { Card, CardContent } from '@/shared/ui/card';

function DownloadMediaCardSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <div className="h-18 w-32 animate-pulse rounded-lg bg-gray-200" />
          </div>
          <div className="flex-1 space-y-5">
            <div className="h-4 animate-pulse rounded bg-gray-200" />
            <div className="flex flex-row gap-2">
              <div className="h-7 w-15 animate-pulse rounded bg-gray-200" />
              <div className="h-7 w-10 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DownloadMediaCardSkeleton;
