const winston = require("winston");
require("winston-mongodb");

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: "logfile.log",
      level: "info", // Log info and higher-level messages (warn, error, etc.)
    }),
    new winston.transports.MongoDB({
      db: "mongodb://localhost/ebook",
      level: "error", // Only log errors to MongoDB
    }),
  ],
});

const uncaughtExceptionLogger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: "uncaughtExceptions.log",
    }),
    new winston.transports.MongoDB({
      db: "mongodb://localhost/ebook",
      collection: "unhandledPromiseRejection-uncaughtException",
      level: "uncaught exception error", // Only log errors
    }),
  ],
});
const unhandledPromiseRejectionLogger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: "unhandledPromiseRejection.log",
    }),
    new winston.transports.MongoDB({
      db: "mongodb://localhost/ebook",
      collection: "unhandledPromiseRejection-uncaughtException",
      level: "error",
    }),
  ],
});
process.on("uncaughtException", (ex) => {
  uncaughtExceptionLogger.error(ex.message, ex);
  console.error(ex.message);
});
process.on("unhandledRejection", (ex) => {
  unhandledPromiseRejectionLogger.error(ex.message, ex);
  console.error(ex.message);
});
function error(
  logger,
  uncaughtExceptionLogger,
  unhandledPromiseRejectionLogger
) {
  return function (err, req, res, next) {
    logger.error(err.message || "An unknown error occurred", err);
    res
      .status(500)
      .send({ message: err.message || "An unknown error occurred" });
  };
}

module.exports.error = error(
  logger,
  uncaughtExceptionLogger,
  unhandledPromiseRejectionLogger
);
module.exports.logger = logger;
