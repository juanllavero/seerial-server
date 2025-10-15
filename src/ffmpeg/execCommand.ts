import ffprobePath from "ffprobe-static";
import ffmpeg from "fluent-ffmpeg";

let ffprobePathFinal = ffprobePath.path;

// If app.asar is used, use app.asar.unpacked
if (ffprobePathFinal.includes("app.asar")) {
  ffprobePathFinal = ffprobePathFinal.replace("app.asar", "app.asar.unpacked");
}

ffmpeg.setFfprobePath(ffprobePathFinal);

export async function probeMediaFile(
  filePath: string,
  timeoutMs: number = 10000
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Create a timeout to stop execution
    const timeout = setTimeout(() => {
      reject(new Error("ffprobe timed out"));
    }, timeoutMs);

    // Exec ffprobe
    ffmpeg.ffprobe(filePath, (err, data) => {
      clearTimeout(timeout); // Clear timeout if ffprobe resolves

      if (err) {
        reject(err);
        return;
      }

      resolve(data);
    });
  });
}
