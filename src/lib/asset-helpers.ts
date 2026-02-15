export const getVideoAssetUrl = (filename: string) => {
  return new URL(`../assets/video/${filename}`, import.meta.url).href
}

export const getImageAssetUrl = (filename: string) => {
  return new URL(`../assets/images/${filename}`, import.meta.url).href
}

export const ASSET_PATHS = {
  videos: {
    usaFlag: '/src/assets/video/flag-video.mp4',
  },
  images: {
    usFlag50: '/src/assets/images/us-flag-50.png',
    betsyRoss: '/src/assets/images/betsy-ross-13-star.png',
    gadsden: '/src/assets/images/gadsden.png',
  }
} as const
