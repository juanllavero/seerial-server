import { useSidebar } from './sidebar';
import SmallSpinner from './small-spinner';

function LoadingInsideSidebar() {
  const { state: sidebarState } = useSidebar();
  return (
    <div
      className={`flex h-full items-center justify-center pb-32 ${sidebarState === 'expanded' ? `pr-56` : `pr-14`}`}
    >
      <SmallSpinner size={40} />
    </div>
  );
}

export default LoadingInsideSidebar;
