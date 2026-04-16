import fs from "node:fs";
import https from "node:https";
import path from "node:path";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");
const VIDEO_FILENAME = "sample.mp4";
export const TEST_VIDEO_PATH = path.join(FIXTURES_DIR, VIDEO_FILENAME);

const SAMPLE_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

export async function ensureVideoFixture(): Promise<string> {
	if (fs.existsSync(TEST_VIDEO_PATH)) {
		return TEST_VIDEO_PATH;
	}

	fs.mkdirSync(FIXTURES_DIR, { recursive: true });

	await downloadFile(SAMPLE_VIDEO_URL, TEST_VIDEO_PATH);
	return TEST_VIDEO_PATH;
}

function downloadFile(url: string, dest: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);
		https
			.get(url, (response) => {
				if (response.statusCode !== 200) {
					file.close();
					fs.unlink(dest, () => {});
					reject(
						new Error(
							`Failed to download video fixture: HTTP ${response.statusCode}`,
						),
					);
					return;
				}

				response.pipe(file);
				file.on("finish", () => {
					file.close();
					resolve();
				});
			})
			.on("error", (err) => {
				file.close();
				fs.unlink(dest, () => {});
				reject(err);
			});
	});
}
