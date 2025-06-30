import { ScreenHeight } from '@/data/enums/Screen'
import { useState, useEffect } from 'react'
import { debounce } from 'lodash'

const useScreenHeight = () => {
  const [screenHeight, setScreenHeight] = useState(ScreenHeight.QHD)

  const updateSize = () => {
    const height = window.innerHeight

    if (height <= 720) {
      setScreenHeight(ScreenHeight.HD)
    } else if (height <= 1080) {
      setScreenHeight(ScreenHeight.FHD)
    } else if (height <= 1440) {
      setScreenHeight(ScreenHeight.QHD)
    } else {
      setScreenHeight(ScreenHeight.UHD)
    }
  }

  const updateSizeDebounced = debounce(updateSize, 200)

  useEffect(() => {
    updateSize()
    window.addEventListener('resize', updateSizeDebounced)

    return () => window.removeEventListener('resize', updateSizeDebounced)
  }, [])

  return screenHeight
}

export default useScreenHeight
