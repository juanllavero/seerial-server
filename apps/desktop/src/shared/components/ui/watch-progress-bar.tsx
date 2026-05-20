interface WatchProgressBarProps {
  duration: number;
  timeWatched: number;
}

function WatchProgressBar({ duration, timeWatched }: WatchProgressBarProps) {
  const watchedMinutes = timeWatched / 60;
  const watchProgress = Math.min((watchedMinutes / duration) * 100, 100);

  if (watchProgress <= duration * 0.05) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-5 bottom-3 left-5 rounded-full p-1"
    >
      <div className="h-3 w-full overflow-hidden rounded-full bg-black">
        <div className="h-full rounded-full bg-app-color" style={{ width: `${watchProgress}%` }} />
      </div>
    </div>
  );
}

export default WatchProgressBar;
