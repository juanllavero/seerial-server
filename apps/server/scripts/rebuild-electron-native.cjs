const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const nativeModules = ["better-sqlite3", "bcrypt"];

function getElectronVersion() {
	try {
		const electronEntry = require.resolve("electron");
		const electronPkgPath = path.join(
			path.dirname(electronEntry),
			"package.json",
		);
		const electronPkg = JSON.parse(fs.readFileSync(electronPkgPath, "utf8"));

		if (!electronPkg.version) {
			throw new Error("Electron package version is missing.");
		}

		return electronPkg.version;
	} catch {
		process.stderr.write("Unable to resolve installed Electron version.\n");
		process.exit(1);
	}
}

function runRebuild(electronVersion) {
	const result = spawnSync("pnpm", ["rebuild", ...nativeModules], {
		stdio: "inherit",
		shell: true,
		env: {
			...process.env,
			npm_config_runtime: "electron",
			npm_config_target: electronVersion,
			npm_config_disturl: "https://electronjs.org/headers",
		},
	});

	if (result.error) {
		process.stderr.write(`${result.error.message}\n`);
		process.exit(1);
	}

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

const electronVersion = getElectronVersion();
runRebuild(electronVersion);
