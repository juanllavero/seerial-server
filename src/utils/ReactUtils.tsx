export class ReactUtils {
  /**
   * This method is used to delay the execution of a function by a certain amount of milliseconds.
   * @param ms - Number of milliseconds to delay
   * @returns
   */
  public static delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))
}

export const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

export const formatTimeForView = (time: number) => {
  const hours = Math.floor(time / 60)
  const minutes = Math.floor(time % 60)

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${hours}h`
    }
  } else {
    return `${minutes}m`
  }
}
