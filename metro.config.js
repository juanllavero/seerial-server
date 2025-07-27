// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname) // eslint-disable-line no-undef

const ALIASES = {
	tslib: path.resolve(__dirname, 'node_modules/tslib/tslib.es6.js'),
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
	// Ensure you call the default resolver.
	return context.resolveRequest(
		context,
		// Use an alias if one exists.
		ALIASES[moduleName] ?? moduleName,
		platform
	)
}

// When enabled, the optional code below will allow Metro to resolve
// and bundle source files with TV-specific extensions
// (e.g., *.ios.tv.tsx, *.android.tv.tsx, *.tv.tsx)
//
// Metro will still resolve source files with standard extensions
// as usual if TV-specific files are not found for a module.
//
if (process.env?.EXPO_TV === '1') {
	const originalSourceExts = config.resolver.sourceExts
	const tvSourceExts = [
		...originalSourceExts.map((e) => `tv.${e}`),
		...originalSourceExts,
	]
	config.resolver.sourceExts = tvSourceExts
}

module.exports = withNativeWind(config, { input: './global.css' })
