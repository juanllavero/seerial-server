// src/stores/deviceStore.js
import { create } from 'zustand'

// Function to check if it's mobile
const checkDevice = () => {
  const userAgent = window.navigator.userAgent.toLowerCase()
  const isMobileDevice = /android|iphone|ipad|ipod|windows phone/i.test(
    userAgent,
  )
  const isNarrow = window.innerWidth <= 720
  return isMobileDevice || isNarrow
}

interface DeviceStoreProps {
  isMobile: boolean
  initializeDeviceDetection: () => void
}

// Store creation
export const useDeviceStore = create<DeviceStoreProps>((set) => ({
  isMobile: checkDevice(), // Initial state
  initializeDeviceDetection: () => {
    // Initial check
    set({ isMobile: checkDevice() })

    // Listener for window size changes
    const handleResize = () => {
      set({ isMobile: checkDevice() })
    }

    window.addEventListener('resize', handleResize)

    // Cleanup function (will run when the store is unmounted or reset)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  },
}))
