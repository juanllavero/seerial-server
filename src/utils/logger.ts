import pino from "pino";

const logger = pino({
  level: "info",
  transport: {
    target: "pino/file",
    options: {
      destination: "logs/scan-library.log",
      mkdir: true,
    },
  },
});

export default logger;
