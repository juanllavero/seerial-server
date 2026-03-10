import * as p from '@clack/prompts';
import pc from 'picocolors';

// 1. Define the allowed colors
export type LogColor = 'cyan' | 'green' | 'magenta' | 'yellow' | 'white' | 'gray';

// 2. Map the type with the real function from picocolors
const colorMap: Record<LogColor, (text: string | number) => string> = {
  cyan: pc.cyan,
  green: pc.green,
  magenta: pc.magenta,
  yellow: pc.yellow,
  white: pc.white,
  gray: pc.gray,
};

// 3. Interface for each line of the log
export interface LogData {
  color: LogColor;
  dato1: string; // Text before the colon
  dato2: string; // Text after the colon
}

// 4. Main interface of the function
export interface WelcomeOptions {
  appName: string;
  data: LogData[];
}

export async function showWelcome({ appName, data }: WelcomeOptions) {
  console.clear();

  // Dynamic title
  p.intro(`${pc.white(`🔥 ${appName.toUpperCase()} 🔥 `)}`);

  // Fixed steps (make them dynamic by passing them in WelcomeOptions if needed)
  p.log.step(pc.white('Initialized 10 capabilities'));
  p.log.step(pc.white('Types and assets generated'));
  p.log.step(pc.white('Scaffold generated'));
  p.log.step(pc.white('Server ready'));

  // Calculate the maximum length of 'dato1' to align the ':' perfectly
  const maxDato1Length = Math.max(...data.map(item => item.dato1.length));

  // Construct the string of the final dynamic block
  let outroString = `${pc.white('🔥 Ready! 🔥')}\n${pc.gray('│')}`;

  data.forEach(item => {
    const applyColor = colorMap[item.color] || pc.white;
    // Right pad dato1 with spaces to align the ':' perfectly
    const paddedDato1 = item.dato1.padEnd(maxDato1Length, ' ');
    
    // Keep dato1 in cyan (like in your capture) and apply the dynamic color to dato2
    outroString += `\n${pc.gray('│')}  ${pc.cyan(`${paddedDato1}:`)}  ${applyColor(item.dato2)}`;
  });

  outroString += `\n${pc.gray('│')}`;

  // Print the result
  p.outro(outroString);
}
