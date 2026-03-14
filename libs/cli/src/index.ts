import * as p from '@clack/prompts';
import color from 'picocolors';

export interface WelcomeOptions {
  url: string;
  swaggerUrl: string;
  env: string;
}

export async function showAppName(appName: string) {
  p.intro(`${color.bgYellow(color.black(` ${appName} `))}`);
}

export async function showMessage(message: string) {
  p.log.step(message);
}

export async function appReadyMessage({ url, swaggerUrl, env }: WelcomeOptions) {
  p.note(
    `Local:    ${color.cyan(url)}\n` +
    `Swagger:    ${color.cyan(swaggerUrl)}\n` +
    `Environment:   ${color.yellow(env)}\n` +
    '🔥 Ready! 🔥'
  );
}