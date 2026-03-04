import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    targets: [
      {
        target: "pino/file",
        options: {
          destination: "logs/app.json.log",
          mkdir: true,
        },
        level: "info",
      },
      {
        target: "pino-pretty",
        options: {
          destination: "logs/app.log",
          colorize: false,
          levelFirst: true,
          translateTime: "yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
          messageFormat:
            "{msg}{if addNewLibrary} - Library: {libraryName} ({libraryType}){end}",
        },
        level: "info",
      },
      {
        target: "pino-pretty",
        options: {
          colorize: true,
          levelFirst: true,
          translateTime: "yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
        level: "debug",
      },
    ],
  },
});

export default logger;
