import { API, api, apiClient } from '@seerial/api';
import { createWithEqualityFn } from 'zustand/traditional';

const BLACK_GRADIENT = ['#000000', '#000000', '#000000', '#000000'];

interface ApiResponse<TData> {
  success: boolean;
  message: string;
  data: TData | null;
  timestamp: string;
}

interface ImageColorsPayload {
  colors?: string[];
}

const isAbsolutePath = (pathString: string): boolean => {
  const windowsPathRegex = /^[a-zA-Z]:[\\/]/;
  const unixPathRegex = /^\//;

  return windowsPathRegex.test(pathString) || unixPathRegex.test(pathString);
};

const getServerOrigin = (): string | null => {
  const baseUrl = apiClient.defaults.baseURL;

  if (typeof baseUrl === 'string' && baseUrl.startsWith('http')) {
    return new URL(baseUrl).origin;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return null;
};

const extractColorsFromImage = async (background?: string) => {
  try {
    const query: { url?: string; localPath?: string } = {};

    if (background) {
      if (background.startsWith('http')) {
        query.url = background;
      } else if (isAbsolutePath(background)) {
        query.localPath = background;
      } else {
        const serverOrigin = getServerOrigin();
        if (!serverOrigin) {
          return BLACK_GRADIENT;
        }

        const apiPath = `/api/${background.replace('resources/img', 'img')}`;
        query.url = new URL(apiPath, serverOrigin).toString();
      }
    } else {
      const serverOrigin = getServerOrigin();
      if (!serverOrigin) {
        return BLACK_GRADIENT;
      }

      query.url = new URL('/img/songDefault.png', serverOrigin).toString();
    }

    const response = await api.get<ApiResponse<ImageColorsPayload>>(API.images.colors, query);
    const dominantColors =
      response.data?.colors?.filter((color) => typeof color === 'string') ?? [];

    return dominantColors.length > 0 ? dominantColors : BLACK_GRADIENT;
  } catch (error) {
    console.error('Error extrayendo colores desde la API:', error);
    return BLACK_GRADIENT;
  }
};

interface GradientState {
  selectedBackground: string;
  contentColors: string[];
  songColors: string[];
  selectBackground: (selectedBackground: string) => void;
  restoreGradient: (isSong: boolean) => void;
  generateGradient: (background: string | undefined, isSong: boolean) => Promise<void>;
}

export const useGradientStore = createWithEqualityFn<GradientState>((set) => ({
  selectedBackground: '',
  contentColors: BLACK_GRADIENT,
  songColors: BLACK_GRADIENT,

  selectBackground: (selectedBackground) => {
    set({ selectedBackground });
  },

  /**
   * Restore gradient to default one
   */
  restoreGradient: (isSong: boolean) => {
    if (isSong) {
      set({ songColors: BLACK_GRADIENT });
    } else {
      set({ contentColors: BLACK_GRADIENT });
    }
  },

  /**
   * Generates an array of dominant colors from an image
   */
  generateGradient: async (background, isSong) => {
    const dominantColors = await extractColorsFromImage(background);

    if (isSong) {
      set({ songColors: dominantColors });
    } else {
      set({ contentColors: dominantColors });
    }
  },
}));
