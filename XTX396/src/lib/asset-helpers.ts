export const getVideoAssetUrl = (filename: string) => {
  return new URL(`../assets/video/${filename}`, import.meta.url).href
}

export const getImageAssetUrl = (filename: string) => {
  return new URL(`../assets/images/${filename}`, import.meta.url).href
}

// Use Vite-resolved URLs so assets work in both dev and production builds
export const ASSET_PATHS = {
  videos: {
    usaFlag: getVideoAssetUrl('flag-video.mp4'),
  },
  images: {
    usFlag50: getImageAssetUrl('us-flag-50.png'),
    betsyRoss: getImageAssetUrl('betsy-ross-13-star.png'),
    gadsden: getImageAssetUrl('gadsden.png'),
  }
} as const
