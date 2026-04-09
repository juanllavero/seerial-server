import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

export const ffmpegPathFinal = ffmpegPath ?? '';
export const ffprobePathFinal = ffprobePath.path ?? '';

const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB
interface FfprobeResult {
  format: Record<string, unknown>;
  streams: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

// If app.asar is used, use app.asar.unpacked
export const getFfmpegPath = () => {
  let path = ffmpegPath ?? '';
  if (path.includes('app.asar')) {
    path = path.replace('app.asar', 'app.asar.unpacked');
  }
  return path;
};

export const getFfprobePath = () => {
  let path = ffprobePath.path ?? '';
  if (path.includes('app.asar')) {
    path = path.replace('app.asar', 'app.asar.unpacked');
  }
  return path;
};

const findSystemFfmpegPath = (): string => {
  const locatorCommand = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(locatorCommand, ['ffmpeg'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  if (result.status !== 0 || !result.stdout) {
    return '';
  }

  const candidatePath = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return candidatePath && existsSync(candidatePath) ? candidatePath : '';
};

export interface ResolvedFfmpegPath {
  packagedPath: string;
  packagedExists: boolean;
  systemPath: string;
  resolvedPath: string;
}

export const resolveFfmpegPath = (): ResolvedFfmpegPath => {
  const packagedPath = getFfmpegPath();
  const packagedExists = !!packagedPath && existsSync(packagedPath);
  const systemPath = packagedExists ? '' : findSystemFfmpegPath();
  const resolvedPath = packagedExists ? packagedPath : systemPath;

  return {
    packagedPath,
    packagedExists,
    systemPath,
    resolvedPath,
  };
};

const getFfmpegExecutableForSpawn = (): string => {
  const { resolvedPath } = resolveFfmpegPath();
  // Let the OS PATH resolve ffmpeg when no absolute binary is available.
  return resolvedPath || 'ffmpeg';
};

export interface FfmpegOptions {
  input?: string;
  output: string;
  args: string[];
}

export interface FfprobeOptions {
  input: string;
  args?: string[];
}

export interface StreamingProcess {
  process: ChildProcess;
  cancel: () => void;
  stderr: string;
}

/**
 * Execute ffmpeg command with given arguments
 */
export function executeFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    let ffmpegProcess: ChildProcess | null = null;
    let stderr = '';
    let isResolved = false;

    const cleanup = () => {
      if (ffmpegProcess) {
        // Force stream destruction
        ffmpegProcess.stdout?.destroy();
        ffmpegProcess.stderr?.destroy();
        ffmpegProcess.stdin?.destroy();

        if (!ffmpegProcess.killed) {
          ffmpegProcess.kill('SIGTERM');

          // Kill after timeout if not exited
          const killTimer = setTimeout(() => {
            if (ffmpegProcess && !ffmpegProcess.killed) {
              ffmpegProcess.kill('SIGKILL');
            }
          }, 5000);
          killTimer.unref?.();
        }
      }
    };

    try {
      ffmpegProcess = spawn(getFfmpegExecutableForSpawn(), args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      ffmpegProcess.stderr?.on('data', (data) => {
        const chunk = data.toString('utf8');
        if (stderr.length + chunk.length > MAX_BUFFER_SIZE) {
          cleanup();
          if (!isResolved) {
            isResolved = true;
            reject(new Error('FFMPEG stderr buffer exceeded limit'));
          }
          return;
        }
        stderr += chunk;
      });

      ffmpegProcess.on('close', (code) => {
        if (isResolved) return;
        isResolved = true;
        cleanup();

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFMPEG exited with code ${code}: ${stderr}`));
        }
      });

      ffmpegProcess.on('error', (err) => {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        reject(new Error(`FFMPEG spawn error: ${err.message}`));
      });

      ffmpegProcess.on('disconnect', () => {
        if (!isResolved) {
          cleanup();
        }
      });
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

/**
 * Execute ffprobe command and return parsed JSON data
 */
export function executeFfprobe(
  filePath: string,
  timeoutMs: number = 10000,
): Promise<FfprobeResult> {
  return new Promise((resolve, reject) => {
    let ffprobeProcess: ChildProcess | null = null;
    let stdout = '';
    let stderr = '';
    let isResolved = false;

    const cleanup = () => {
      if (ffprobeProcess) {
        ffprobeProcess.stdout?.destroy();
        ffprobeProcess.stderr?.destroy();
        ffprobeProcess.stdin?.destroy();

        if (!ffprobeProcess.killed) {
          ffprobeProcess.kill('SIGTERM');

          const killTimer = setTimeout(() => {
            if (ffprobeProcess && !ffprobeProcess.killed) {
              ffprobeProcess.kill('SIGKILL');
            }
          }, 5000);
          killTimer.unref?.();
        }
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      if (!isResolved) {
        isResolved = true;
        reject(new Error('ffprobe timed out'));
      }
    }, timeoutMs);
    timeout.unref?.();

    try {
      const args = [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        filePath,
      ];

      ffprobeProcess = spawn(getFfprobePath(), args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      ffprobeProcess.stdout?.on('data', (data) => {
        const chunk = data.toString('utf8');
        if (stdout.length + chunk.length > MAX_BUFFER_SIZE) {
          cleanup();
          clearTimeout(timeout);
          if (!isResolved) {
            isResolved = true;
            reject(new Error('ffprobe stdout buffer exceeded limit'));
          }
          return;
        }
        stdout += chunk;
      });

      ffprobeProcess.stderr?.on('data', (data) => {
        stderr += data.toString('utf8');
      });

      ffprobeProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (isResolved) return;
        isResolved = true;

        cleanup();

        if (code === 0) {
          try {
            const data = JSON.parse(stdout) as FfprobeResult;
            resolve(data);
          } catch (err) {
            reject(new Error(`Failed to parse ffprobe output: ${err}`));
          }
        } else {
          reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
        }
      });

      ffprobeProcess.on('error', (err) => {
        clearTimeout(timeout);
        cleanup();
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`ffprobe spawn error: ${err.message}`));
        }
      });

      ffprobeProcess.on('disconnect', () => {
        if (!isResolved) {
          cleanup();
        }
      });
    } catch (err) {
      clearTimeout(timeout);
      cleanup();
      reject(err);
    }
  });
}

/**
 * Execute ffmpeg command and pipe output to a writable stream
 */
export function executeFfmpegPipe(
  args: string[],
  outputStream: NodeJS.WritableStream,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let ffmpegProcess: ChildProcess | null = null;
    let stderr = '';
    let isResolved = false;

    const cleanup = () => {
      if (ffmpegProcess) {
        // stdout is being used by outputStream
        ffmpegProcess.stderr?.destroy();
        ffmpegProcess.stdin?.destroy();

        if (!ffmpegProcess.killed) {
          ffmpegProcess.kill('SIGTERM');

          const killTimer = setTimeout(() => {
            if (ffmpegProcess && !ffmpegProcess.killed) {
              ffmpegProcess.kill('SIGKILL');
            }
          }, 5000);
          killTimer.unref?.();
        }
      }
    };

    try {
      ffmpegProcess = spawn(getFfmpegExecutableForSpawn(), args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Pipe stdout to output stream
      const pipeStream = ffmpegProcess.stdout?.pipe(outputStream);

      pipeStream?.on('finish', () => {
        // Pipe ended, no need to wait for ffmpeg to exit
      });

      outputStream.on('error', (err) => {
        cleanup();
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`Output stream error: ${err.message}`));
        }
      });

      ffmpegProcess.stderr?.on('data', (data) => {
        stderr += data.toString('utf8');
      });

      ffmpegProcess.on('close', (code) => {
        if (isResolved) return;
        isResolved = true;

        cleanup();

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFMPEG exited with code ${code}: ${stderr}`));
        }
      });

      ffmpegProcess.on('error', (err) => {
        cleanup();
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`FFMPEG spawn error: ${err.message}`));
        }
      });

      ffmpegProcess.on('disconnect', () => {
        if (!isResolved) {
          cleanup();
        }
      });
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

export function executeFfprobeRaw(args: string[], timeoutMs: number = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    let ffprobeProcess: ChildProcess | null = null;
    let stdout = '';
    let stderr = '';
    let isResolved = false;

    const cleanup = () => {
      if (ffprobeProcess) {
        ffprobeProcess.stdout?.destroy();
        ffprobeProcess.stderr?.destroy();
        ffprobeProcess.stdin?.destroy();

        if (!ffprobeProcess.killed) {
          ffprobeProcess.kill('SIGTERM');

          const killTimer = setTimeout(() => {
            if (ffprobeProcess && !ffprobeProcess.killed) {
              ffprobeProcess.kill('SIGKILL');
            }
          }, 5000);
          killTimer.unref?.();
        }
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      if (!isResolved) {
        isResolved = true;
        reject(new Error('ffprobe timed out'));
      }
    }, timeoutMs);
    timeout.unref?.();

    try {
      ffprobeProcess = spawn(getFfprobePath(), args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      ffprobeProcess.stdout?.on('data', (data) => {
        stdout += data.toString('utf8');
      });

      ffprobeProcess.stderr?.on('data', (data) => {
        stderr += data.toString('utf8');
      });

      ffprobeProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (isResolved) return;
        isResolved = true;

        cleanup();

        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
        }
      });

      ffprobeProcess.on('error', (err) => {
        clearTimeout(timeout);
        cleanup();
        if (!isResolved) {
          isResolved = true;
          reject(new Error(`ffprobe spawn error: ${err.message}`));
        }
      });

      ffprobeProcess.on('disconnect', () => {
        if (!isResolved) {
          cleanup();
        }
      });
    } catch (err) {
      clearTimeout(timeout);
      cleanup();
      reject(err);
    }
  });
}

/**
 * Execute ffmpeg command and pipe output to a stream for real-time streaming
 * Returns an object with the process, cancel function, and stderr accumulator
 */
export function executeFfmpegPipeToStream(
  args: string[],
  outputStream: NodeJS.WritableStream,
  onError?: (err: Error) => void,
  onClose?: (code: number | null) => void,
): StreamingProcess {
  let ffmpegProcess: ChildProcess | null = null;
  let stderr = '';
  let isCancelled = false;
  let isFinished = false;

  const cleanup = (signal: NodeJS.Signals = 'SIGTERM') => {
    if (isCancelled || !ffmpegProcess) return;
    isCancelled = true;

    // Remove listeners
    ffmpegProcess.stderr?.removeAllListeners();
    ffmpegProcess.stdout?.removeAllListeners();

    // stdout is being used by outputStream
    ffmpegProcess.stderr?.destroy();
    ffmpegProcess.stdin?.destroy();

    if (!ffmpegProcess.killed) {
      ffmpegProcess.kill(signal);

      // Kill after timeout if not exited
      if (signal === 'SIGTERM') {
        const killTimer = setTimeout(() => {
          if (ffmpegProcess && !ffmpegProcess.killed) {
            ffmpegProcess.kill('SIGKILL');
          }
        }, 5000);
        killTimer.unref?.();
      }
    }
  };

  const cancel = () => {
    cleanup('SIGTERM');
  };

  try {
    ffmpegProcess = spawn(getFfmpegExecutableForSpawn(), args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Pipe output to stream
    ffmpegProcess.stdout?.pipe(outputStream, { end: false });

    // Debugging
    ffmpegProcess.stderr?.on('data', (data) => {
      if (!isCancelled) {
        const chunk = data.toString('utf8');
        // Limit buffer size
        if (stderr.length < MAX_BUFFER_SIZE) {
          stderr += chunk;
        }
      }
    });

    // Manage errors on output stream
    outputStream.on('error', (err) => {
      if (!isFinished) {
        isFinished = true;
        cleanup();
        if (onError) {
          onError(new Error(`Output stream error: ${err.message}`));
        }
      }
    });

    // Manage stream close
    outputStream.on('close', () => {
      if (!isFinished && !isCancelled) {
        cleanup();
      }
    });

    // Manage close of ffmpeg process
    ffmpegProcess.on('close', (code) => {
      if (isFinished) return;
      isFinished = true;

      cleanup();

      if (onClose) {
        onClose(code);
      }

      // Error handling
      if (code !== 0 && !isCancelled && onError) {
        onError(new Error(`FFMPEG exited with code ${code}: ${stderr}`));
      }
    });

    // Spawn error handling
    ffmpegProcess.on('error', (err) => {
      if (isFinished) return;
      isFinished = true;

      cleanup();

      if (onError) {
        onError(new Error(`FFMPEG spawn error: ${err.message}`));
      }
    });

    // Disconnect handling
    ffmpegProcess.on('disconnect', () => {
      if (!isFinished) {
        cleanup();
      }
    });
  } catch (err) {
    cleanup();
    if (onError) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  if (!ffmpegProcess) {
    throw new Error('FFMPEG process failed to initialize');
  }

  return {
    process: ffmpegProcess,
    cancel,
    stderr,
  };
}
