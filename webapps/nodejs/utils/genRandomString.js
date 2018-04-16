const crypto = require("crypto");
module.exports = length =>
  crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
