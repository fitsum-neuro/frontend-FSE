const config = require("config");
module.exports = function () {
  if (!config.get("jwtPrivateKey")) {
    console.error("FATAL ERROR: JWT Private Key is not defined");
    process.exit(1); // exit the application with an error status code 1
  }
};
