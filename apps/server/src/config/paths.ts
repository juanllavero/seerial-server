export const defaultPaths = {
	config: {
		keys: ["resources", "config", "keys.properties"],
		serverId: ["resources", "config", "server.id"],
		server: ["resources", "config", "serverConfig.json"],
		web: ["resources", "config", "webConfig.json"],
	},
	db: ["resources", "db", "data.db"],
	ytDlp: ["resources", "lib", "yt-dlp.exe"],
	cache: ["resources", "cache"],
	music: ["resources", "music"],
	video: ["resources", "video"],
	images: {
		root: ["resources", "img"],
		logos: ["resources", "img", "logos"],
		backgrounds: ["resources", "img", "backgrounds"],
		posters: ["resources", "img", "posters"],
		collages: ["resources", "img", "collages"],
		default: ["resources", "img", "default"],
		cache: ["resources", "img", "DownloadCache"],
		thumbnails: {
			root: ["resources", "img", "thumbnails"],
			video: ["resources", "img", "thumbnails", "video"],
			chapters: ["resources", "img", "thumbnails", "chapters"],
		},
	},
};
