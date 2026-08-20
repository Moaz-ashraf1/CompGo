import winston from "winston";

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "HH:mm:ss" }),

  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0
        ? ` ${JSON.stringify(meta)}`
        : "";

    return `[${timestamp}] : ${level} : ${message}${metaStr}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level:
    process.env.NODE_ENV === "production"
      ? "info"
      : "debug",

  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),

    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileFormat,
    }),

    new winston.transports.File({
      filename: "logs/combined.log",
      format: fileFormat,
    }),
  ],
});