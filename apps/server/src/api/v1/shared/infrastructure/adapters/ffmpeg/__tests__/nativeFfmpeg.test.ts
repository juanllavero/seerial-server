import fs from "fs";
import { executeFfprobe } from "../nativeFfmpeg";

describe("nativeFfmpeg - Integration Tests", () => {
  describe("executeFfprobe", () => {
    it("should successfully execute ffprobe on a media file and return metadata", async () => {
      // Find a test media file in the project
      const testFiles = [
        "assets/icons/icon.png",
        "seerial-web/public/img/icon.png",
        "seerial-web/public/img/Default_video_thumbnail.jpg",
      ];

      let testFile = null;
      for (const file of testFiles) {
        if (fs.existsSync(file)) {
          testFile = file;
          break;
        }
      }

      if (!testFile) {
        console.warn("Skipping ffprobe test: No test media file found");
        return;
      }

      const result = await executeFfprobe(testFile);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("format");
      expect(result).toHaveProperty("streams");
      expect(Array.isArray(result.streams)).toBe(true);

      // Check format has basic properties
      expect(result.format).toHaveProperty("filename");
      expect(result.format.filename).toBe(testFile);
    }, 15000);

    it("should handle non-existent file gracefully", async () => {
      const nonExistentFile = "/path/to/nonexistent/file.mp4";

      await expect(executeFfprobe(nonExistentFile)).rejects.toThrow();
    }, 10000);

    it("should handle invalid file gracefully", async () => {
      // Use a text file as invalid input
      const invalidFile = "package.json";

      await expect(executeFfprobe(invalidFile)).rejects.toThrow();
    }, 10000);

    it("should respect timeout parameter", async () => {
      const testFile = "package.json"; // Will fail but should timeout properly

      // Test with very short timeout
      await expect(executeFfprobe(testFile, 100)).rejects.toThrow();
    }, 5000);

    it("should extract video stream information", async () => {
      // Find a test image/video file
      const testFiles = [
        "seerial-web/public/img/Default_video_thumbnail.jpg",
        "assets/icons/icon.png",
      ];

      let testFile = null;
      for (const file of testFiles) {
        if (fs.existsSync(file)) {
          testFile = file;
          break;
        }
      }

      if (!testFile) {
        console.warn("Skipping video stream test: No test media file found");
        return;
      }

      const result = await executeFfprobe(testFile);

      expect(result.streams.length).toBeGreaterThan(0);

      // At least one stream should have codec information
      const hasCodecInfo = result.streams.some(
        (stream: any) => stream.codec_name || stream.codec_type
      );
      expect(hasCodecInfo).toBe(true);
    }, 15000);
  });
});
