export class ReactUtils {
  /**
   * This method is used to delay the execution of a function by a certain amount of milliseconds.
   * @param ms - Number of milliseconds to delay
   * @returns
   */
  public static delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))
}
