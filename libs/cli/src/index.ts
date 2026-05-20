import color from 'picocolors';

export interface WelcomeOptions {
  url: string;
  swaggerUrl: string;
  env: string;
}

// 1. Function to detect if the current terminal supports Unicode without breaking
const isUnicodeSupported = () => {
  if (process.platform !== 'win32') return true; // Mac and Linux support it natively

  return (
    Boolean(process.env.CI) ||
    Boolean(process.env.WT_SESSION) || // Windows Terminal (the new one)
    process.env.TERM_PROGRAM === 'vscode' || // VS Code integrated terminal
    process.env.TERM === 'xterm-256color' ||
    process.env.TERM === 'alacritty'
  );
};

// 2. We evaluate the environment (You can force it to false temporarily to test `const unicode = false;`)
const unicode = isUnicodeSupported();

// 3. Dynamic sys object
const sys = {
  bar: color.green(unicode ? '│' : '|'),
  start: color.green(unicode ? '┌' : '+'),
  diamond: color.green(unicode ? '◇' : '*'),
  branch: color.green(unicode ? '├' : '+'),
  topRight: color.green(unicode ? '╮' : '+'),
  bottomRight: color.green(unicode ? '╯' : '+'),
  horizontal: color.green(unicode ? '─' : '-'),
};

// biome-ignore lint/suspicious/noControlCharactersInRegex: This regex is used to strip ANSI escape codes from strings.
const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');

export async function showAppName(appName: string) {
  console.log(`${sys.start}  ${color.bgYellow(color.black(` ${appName} `))}`);
}

export async function showMessage(message: string) {
  console.log(sys.bar);
  console.log(`${sys.diamond}  ${message}`);
}

export async function appReadyMessage({ url, swaggerUrl, env }: WelcomeOptions) {
  const contentLines = [
    ` Local:        ${color.cyan(url)} `,
    ` Swagger:      ${color.cyan(swaggerUrl)} `,
    ` Environment:  ${color.yellow(env)} `
  ];

  // 1. Define the title
  const title = ' 🔥 Ready! 🔥 ';

  // NOTE: Emojis like 🔥 count as 2 characters in JS.
  // ' ' (1) + 🔥 (2) + ' Ready! ' (8) + 🔥 (2) + ' ' (1) = 14 theoretical characters.
  const titleLength = title.length;

  // 2. Calculate the width based on the longest content line
  let maxWidth = Math.max(...contentLines.map(l => stripAnsi(l).length));

  // 3. For safety: if the title is longer than the content,
  // we force the box to be wide enough.
  if (titleLength > maxWidth + 2) {
    maxWidth = titleLength - 2;
  }

  // 4. Calculate how many horizontal lines to fill on top
  // (Desired total width) - (Space already occupied by the title)
  const topBarRepeats = (maxWidth + 2) - titleLength;

  console.log(sys.bar);

  // Top border with embedded title and remaining horizontal lines
  console.log(`${sys.diamond}${title}${sys.horizontal.repeat(topBarRepeats)}${sys.topRight}`);
  console.log(`${sys.bar}  ${' '.repeat(maxWidth)}${sys.bar}`);

  // Content
  for (const line of contentLines) {
    const paddingLength = maxWidth - stripAnsi(line).length;
    const padding = ' '.repeat(Math.max(0, paddingLength));
    console.log(`${sys.bar}  ${line}${padding}${sys.bar}`);
  }

  // Standard bottom border
  console.log(`${sys.bar}  ${' '.repeat(maxWidth)}${sys.bar}`);
  console.log(`${sys.branch}${sys.horizontal.repeat(maxWidth + 2)}${sys.bottomRight}`);
}

// Async function to simulate loading with a spinner
export function spinner() {
  let currentMessage = '';

  return {
    start(message: string) {
      currentMessage = message;
      // Print the connector line
      console.log(sys.bar);

      // Print the loading status statically
      // We use the '⠋' icon to maintain visual consistency, but without animation
      console.log(`${sys.bar}  ${color.green('⠋')} ${color.dim(currentMessage)}`);
    },

    stop(message?: string) {
      // Print another connector line to maintain visual continuity
      console.log(sys.bar);

      // Print the final result with the diamond
      console.log(`${sys.diamond}  ${message || currentMessage}`);
    }
  };
}