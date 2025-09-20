const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "server.log");

function log(message) {
  const logEntry = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, logEntry, "utf8");
}

function loggingMiddleware(req, res, next) {
  log(`${req.method} ${req.originalUrl}`);
  res.on("finish", () => {
    log(`Response: ${res.statusCode}`);
  });
  next();
}

module.exports = { loggingMiddleware, log };
