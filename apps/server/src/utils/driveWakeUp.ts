import fs from 'node:fs/promises';
import path from 'node:path';
import logger from '@/utils/logger';

const driveWakeUpLogger = logger.child({ category: 'Drive Wake-Up' });

/**
 * Extracts unique drive root paths from an array of folder paths.
 * On Windows this returns roots like "C:\", "D:\".
 * On Linux/macOS this returns "/" (or distinct mount roots if paths differ).
 */
function uniqueDriveRoots(folders: string[]): string[] {
  const roots = new Set<string>();

  for (const folder of folders) {
    const { root } = path.parse(folder);
    if (root) {
      roots.add(root);
    }
  }

  return Array.from(roots);
}

/**
 * Triggers a lightweight stat call on each unique drive root derived from
 * the provided folder list. Runs fire-and-forget so that the calling code
 * is never delayed waiting for spinning disks to wake up.
 */
export function wakeUpDrives(folders: string[]): void {
  const roots = uniqueDriveRoots(folders);

  if (roots.length === 0) return;

  driveWakeUpLogger.debug({ roots }, 'Waking up drives');

  for (const root of roots) {
    fs.stat(root).catch((err) => {
      driveWakeUpLogger.warn({ root, err }, 'Drive wake-up stat failed');
    });
  }
}
