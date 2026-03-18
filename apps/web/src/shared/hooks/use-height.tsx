import { debounce } from 'lodash';
import { useEffect, useState } from 'react';
import { ScreenHeight } from '@/shared/data/enums/screen';

const useScreenHeight = () => {
  const [screenHeight, setScreenHeight] = useState<ScreenHeight>(ScreenHeight.QHD);

  const updateSize = () => {
    const height = window.innerHeight;

    if (height <= 720) {
      setScreenHeight(ScreenHeight.HD);
    } else if (height <= 1080) {
      setScreenHeight(ScreenHeight.FHD);
    } else if (height <= 1440) {
      setScreenHeight(ScreenHeight.QHD);
    } else {
      setScreenHeight(ScreenHeight.UHD);
    }
  };

  const updateSizeDebounced = debounce(updateSize, 200);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSizeDebounced);

    return () => window.removeEventListener('resize', updateSizeDebounced);
  }, []);

  return screenHeight;
};

export default useScreenHeight;
