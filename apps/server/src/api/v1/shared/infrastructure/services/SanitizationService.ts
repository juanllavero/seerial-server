import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
	audioExtensions,
	imageExtensions,
	videoExtensions,
} from "@/utils/constants";
import logger from "@/utils/logger";

const sanitizationLogger = logger.child({ category: "Sanitization" });

// Patterns to detect path traversal
const dangerousPatterns = [
	/\.\./g, // Parent directory traversal
	/~\//g, // Home directory shortcuts
	/\0/g, // Null bytes
	/%00/g, // URL encoded null bytes
	/%2e%2e/gi, // URL encoded ..
	/%252e%252e/gi, // Double URL encoded ..
];

function decodePathSafely(rawPath: string): string {
	try {
		return decodeURIComponent(rawPath);
	} catch {
		return rawPath;
	}
}

function isWindowsDrivePath(inputPath: string): boolean {
	return /^[A-Za-z]:[\\/]/.test(inputPath);
}

function normalizeForCurrentOs(inputPath: string): string {
	if (process.platform === "win32") {
		return path.win32.normalize(inputPath.replace(/\//g, "\\"));
	}

	return path.posix.normalize(inputPath.replace(/\\/g, "/"));
}

function toAbsolutePath(inputPath: string): string {
	if (process.platform === "win32") {
		return path.win32.resolve(inputPath);
	}

	return path.posix.resolve(inputPath);
}

function normalizePathForComparison(inputPath: string): string {
	const normalized = normalizeForCurrentOs(inputPath);
	return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

/**
 * Builds platform-aware path candidates from a raw file path.
 * This allows accepting Windows-formatted paths on Unix-like systems
 * and mixed-separator inputs coming from URLs or JWT payloads.
 */
export function buildCompatiblePathCandidates(filePath: string): string[] {
	const decodedPath = decodePathSafely(filePath)
		.trim()
		.replace(/^['"]|['"]$/g, "");
	const candidates = new Set<string>();

	if (!decodedPath) {
		return [];
	}

	// Candidate for the current OS using separator normalization only.
	candidates.add(toAbsolutePath(normalizeForCurrentOs(decodedPath)));

	// Windows drive path support across OSes (e.g. F:\media\movie.mkv).
	if (isWindowsDrivePath(decodedPath)) {
		const driveLetter = decodedPath.charAt(0).toLowerCase();
		const withoutDrive = decodedPath
			.slice(2)
			.replace(/\\/g, "/")
			.replace(/^\/+/, "");

		candidates.add(
			path.win32.resolve(
				path.win32.normalize(decodedPath.replace(/\//g, "\\")),
			),
		);
		candidates.add(
			path.posix.resolve(path.posix.normalize(decodedPath.replace(/\\/g, "/"))),
		);
		candidates.add(
			path.posix.resolve(
				path.posix.normalize(`/mnt/${driveLetter}/${withoutDrive}`),
			),
		);
		candidates.add(
			path.posix.resolve(
				path.posix.normalize(`/Volumes/${driveLetter}/${withoutDrive}`),
			),
		);
	}

	// WSL-style paths on Windows (e.g. /mnt/f/media/movie.mkv).
	if (process.platform === "win32") {
		const mntMatch = decodedPath.match(/^\/mnt\/([a-zA-Z])\/(.*)$/);
		if (mntMatch) {
			const drive = `${mntMatch[1].toUpperCase()}:\\`;
			const rest = mntMatch[2].replace(/\//g, "\\");
			candidates.add(path.win32.resolve(path.win32.join(drive, rest)));
		}
	}

	return Array.from(candidates);
}

/**
 * Sanitizes a file path and checks if it is secure
 * @param filePath File path to sanitize
 * @param allowedBasePaths Allowed base paths (optional)
 * @returns Sanitized file path
 * @throws Error if the path is invalid or insecure
 */
export function sanitizeFilePath(
	filePath: string,
	allowedBasePaths?: string[],
): string {
	if (!filePath || typeof filePath !== "string") {
		throw new Error("Invalid file path: path must be a non-empty string");
	}

	const decodedPath = decodePathSafely(filePath);

	// Detect dangerous patterns
	for (const pattern of dangerousPatterns) {
		if (pattern.test(decodedPath)) {
			throw new Error(
				"Invalid file path: contains dangerous patterns (path traversal attempt)",
			);
		}
	}

	const candidates = buildCompatiblePathCandidates(decodedPath);
	if (!candidates.length) {
		throw new Error("Invalid file path: path could not be normalized");
	}

	const normalizedAllowedBasePaths =
		allowedBasePaths?.map((basePath) =>
			normalizePathForComparison(toAbsolutePath(basePath)),
		) ?? [];

	for (const candidate of candidates) {
		// Verify that the path does not contain parent directory references after normalization.
		if (candidate.includes("..")) {
			continue;
		}

		if (normalizedAllowedBasePaths.length === 0) {
			return candidate;
		}

		const normalizedCandidate = normalizePathForComparison(candidate);
		const isWithinAllowedPath = normalizedAllowedBasePaths.some((basePath) =>
			normalizedCandidate.startsWith(basePath),
		);

		if (isWithinAllowedPath) {
			return candidate;
		}
	}

	if (normalizedAllowedBasePaths.length > 0) {
		throw new Error("Invalid file path: path is outside allowed directories");
	}

	// If no candidate matched the policy but there are no allowed paths constraints,
	// return the first candidate so downstream checks (existence/type) can report precisely.
	if (candidates.length > 0) {
		return candidates[0];
	}

	throw new Error("Invalid file path: path could not be normalized");
}

function resolveExistingPathCandidate(filePath: string): string | null {
	const candidates = buildCompatiblePathCandidates(filePath);
	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	return null;
}

/**
 * Sanitizes and validates a directory path
 * @param dirPath Directory path to sanitize
 * @param allowedBasePaths Allowed base paths (optional)
 * @param shouldExist If the directory should exist
 * @returns Sanitized directory path
 */
export function sanitizeDirectoryPath(
	dirPath: string,
	allowedBasePaths?: string[],
	shouldExist: boolean = false,
): string {
	const sanitizedPath = sanitizeFilePath(dirPath, allowedBasePaths);

	if (shouldExist) {
		if (!fs.existsSync(sanitizedPath)) {
			throw new Error("Directory does not exist");
		}

		const stats = fs.statSync(sanitizedPath);
		if (!stats.isDirectory()) {
			throw new Error("Path is not a directory");
		}
	}

	return sanitizedPath;
}

/**
 * Sanitizes and validates a file path with a specific extension
 * @param filePath File path to sanitize
 * @param allowedExtensions Allowed extensions
 * @param allowedBasePaths Allowed base paths (optional)
 * @param shouldExist If the file should exist
 * @returns Sanitized file path
 */
export function sanitizeFilePathWithExtension(
	filePath: string,
	allowedExtensions: string[],
	allowedBasePaths?: string[],
	shouldExist: boolean = false,
): string {
	const sanitizedPath = sanitizeFilePath(filePath, allowedBasePaths);

	const ext = path.extname(sanitizedPath).toLowerCase();
	if (!allowedExtensions.includes(ext)) {
		throw new Error(
			`Invalid file extension: ${ext}. Allowed: ${allowedExtensions.join(", ")}`,
		);
	}

	if (shouldExist) {
		const existingPath =
			resolveExistingPathCandidate(sanitizedPath) ??
			resolveExistingPathCandidate(filePath);
		if (!existingPath) {
			throw new Error("File does not exist");
		}

		const stats = fs.statSync(existingPath);
		if (!stats.isFile()) {
			throw new Error("Path is not a file");
		}

		return existingPath;
	}

	return sanitizedPath;
}

/**
 * Sanitizes a video path
 */
export function sanitizeVideoPath(
	videoPath: string,
	allowedBasePaths?: string[],
	shouldExist: boolean = true,
): string {
	return sanitizeFilePathWithExtension(
		videoPath,
		videoExtensions,
		allowedBasePaths,
		shouldExist,
	);
}

/**
 * Sanitizes an audio path
 */
export function sanitizeAudioPath(
	audioPath: string,
	allowedBasePaths?: string[],
	shouldExist: boolean = true,
): string {
	return sanitizeFilePathWithExtension(
		audioPath,
		audioExtensions,
		allowedBasePaths,
		shouldExist,
	);
}

/**
 * Sanitizes an image path
 */
export function sanitizeImagePath(
	imagePath: string,
	allowedBasePaths?: string[],
	shouldExist: boolean = true,
): string {
	return sanitizeFilePathWithExtension(
		imagePath,
		imageExtensions,
		allowedBasePaths,
		shouldExist,
	);
}

/**
 * Gets the default allowed paths of the system
 * Includes the user's home directory and mounted volumes
 */
export function getSystemAllowedPaths(): string[] {
	const allowedPaths: string[] = [];
	const platform = os.platform();

	// Home directory
	allowedPaths.push(os.homedir());

	if (platform === "win32") {
		// On Windows, add all existing drives
		const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		for (let i = 0; i < letters.length; i++) {
			const drive = `${letters[i]}:\\`;
			if (fs.existsSync(drive)) {
				allowedPaths.push(drive);
			}
		}
	} else {
		// On Unix-like (Linux, macOS)
		allowedPaths.push("/");

		// On macOS, add mounted volumes
		const volumes = "/Volumes";
		if (fs.existsSync(volumes)) {
			try {
				const mountedVolumes = fs.readdirSync(volumes);
				mountedVolumes.forEach((volume) => {
					allowedPaths.push(path.join(volumes, volume));
				});
			} catch (error) {
				sanitizationLogger.error(error, "Error reading volumes");
			}
		}
	}

	return allowedPaths;
}

/**
 * Validates multiple file paths
 * @param filePaths Array of file paths to validate
 * @param allowedExtensions Allowed extensions (optional)
 * @param allowedBasePaths Allowed base paths (optional)
 * @returns Array of sanitized file paths
 */
export function sanitizeMultipleFilePaths(
	filePaths: string[],
	allowedExtensions?: string[],
	allowedBasePaths?: string[],
): string[] {
	if (!Array.isArray(filePaths)) {
		throw new Error("File paths must be an array");
	}

	return filePaths.map((filePath) => {
		if (allowedExtensions) {
			return sanitizeFilePathWithExtension(
				filePath,
				allowedExtensions,
				allowedBasePaths,
			);
		}
		return sanitizeFilePath(filePath, allowedBasePaths);
	});
}

/**
 * Combines a base path with a file name securely
 * @param basePath Base path
 * @param fileName File name
 * @returns Combined and sanitized path
 */
export function safeJoinPath(basePath: string, fileName: string): string {
	// Sanitize the base path
	const sanitizedBase = sanitizeDirectoryPath(basePath);

	// Validate that the file name does not contain path separators
	if (!fileName || typeof fileName !== "string") {
		throw new Error("Invalid file name");
	}

	// Remove any slashes from the file name
	const cleanFileName = fileName.replace(/[/\\]/g, "");

	if (cleanFileName !== fileName) {
		throw new Error("File name contains path separators");
	}

	// Combine the paths
	const joinedPath = path.join(sanitizedBase, cleanFileName);

	// Verify that the resulting path is within the base path
	const resolvedJoined = path.resolve(joinedPath);
	const resolvedBase = path.resolve(sanitizedBase);

	if (!resolvedJoined.startsWith(resolvedBase)) {
		throw new Error("Resulting path is outside base directory");
	}

	return resolvedJoined;
}

/**
 * Validates a file name (without path)
 * @param fileName File name to validate
 * @returns true if the file name is valid
 */
export function isValidFileName(fileName: string): boolean {
	if (!fileName || typeof fileName !== "string") {
		return false;
	}

	// Must not contain path separators
	if (fileName.includes("/") || fileName.includes("\\")) {
		return false;
	}

	// Must not contain null bytes
	if (fileName.includes("\0")) {
		return false;
	}

	// Must not be "." or ".."
	if (fileName === "." || fileName === "..") {
		return false;
	}

	return true;
}
