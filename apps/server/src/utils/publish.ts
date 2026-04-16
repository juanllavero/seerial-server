import { config } from "dotenv";
import { build } from "electron-builder";
import logger from "./logger";

config(); // Load environment variables

if (!process.env.GH_TOKEN) {
	logger.error("GH_TOKEN not found in .env");
	process.exit(1);
}

build({
	publish: "always",
	config: {
		directories: {
			output: "prod",
		},
		files: [
			"prod/*.exe", // Only publish the .exe file
		],
	},
})
	.then(() => {
		logger.info("Publish accepted");
	})
	.catch((error) => {
		logger.error(error, "Error publishing");
		process.exit(1);
	});
