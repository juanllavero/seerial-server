/**
 * Declares the module 'react-native-pixel-perfect' for TypeScript.
 * This provides type definitions for the library since it doesn't ship with its own.
 */
declare module 'react-native-pixel-perfect' {
	/**
	 * Defines the structure for the design resolution object.
	 * It must contain the width and height of the design screen.
	 */
	interface DesignResolution {
		width: number
		height: number
	}

	/**
	 * Defines the type for the scaling function returned by `create`.
	 * It's a function that takes a number (the original pixel size)
	 * and returns a new number (the scaled pixel size).
	 */
	type Scaler = (size: number) => number

	/**
	 * Declares the `create` function exported by the module.
	 * @param resolution The design resolution object used as a base for scaling.
	 * @returns A `Scaler` function that you can use to scale your pixel values.
	 */
	export function create(resolution: DesignResolution): Scaler
}
