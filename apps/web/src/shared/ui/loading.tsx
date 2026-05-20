import '@/styles/components/loading.css';
import SmallSpinner from './small-spinner';

function Loading() {
  return (
    <div className="loading-content">
      <SmallSpinner size={40} />
    </div>
  );
}

export default Loading;
