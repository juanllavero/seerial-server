import { isAbsolutePath } from '@/utils/ReactUtils'
import { extractColors } from 'extract-colors'
import { createWithEqualityFn } from 'zustand/traditional'

const BLACK_GRADIENT = ['#000000', '#000000', '#000000', '#000000']

const extractColorsFromImage = async (imgSrc: string) => {
  try {
    const options = {
      pixels: 50000,
      distance: 0.15,
      saturationDistance: 0.5,
      lightnessDistance: 0.12,
      hueDistance: 0.05,
    }
    const extractedColors = await extractColors(imgSrc, options)
    const dominantColors = extractedColors.slice(0, 5).map((color) => color.hex)
    return dominantColors.length > 0 ? dominantColors : BLACK_GRADIENT
  } catch (error) {
    console.error('Error extrayendo colores:', error)
    return BLACK_GRADIENT
  }
}

interface GradientState {
  selectedBackground: string
  contentColors: string[]
  songColors: string[]
  selectBackground: (selectedBackground: string) => void
  restoreGradient: (isSong: boolean) => void
  generateGradient: (
    background: string | undefined,
    isSong: boolean,
  ) => Promise<void>
}

export const useGradientStore = createWithEqualityFn<GradientState>((set) => ({
  selectedBackground: '',
  contentColors: BLACK_GRADIENT,
  songColors: BLACK_GRADIENT,

  selectBackground: (selectedBackground) => {
    set({ selectedBackground })
  },

  /**
   * Restore gradient to default one
   */
  restoreGradient: (isSong: boolean) => {
    if (isSong) {
      set({ songColors: BLACK_GRADIENT })
    } else {
      set({ contentColors: BLACK_GRADIENT })
    }
  },

  /**
   * Generates an array of dominant colors from an image
   */
  generateGradient: async (background, isSong) => {
    let imageUrl = '/img/songDefault.png'

    if (background) {
      imageUrl = background.startsWith('http')
        ? background
        : isAbsolutePath(background)
          ? `/api/image?path=${background}`
          : `/api/${background.replace('resources/img', 'img')}`
    }

    const dominantColors = await extractColorsFromImage(imageUrl)

    if (isSong) {
      set({ songColors: dominantColors })
    } else {
      set({ contentColors: dominantColors })
    }
  },
}))
