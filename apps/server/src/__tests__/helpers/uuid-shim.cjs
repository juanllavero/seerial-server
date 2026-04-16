// CommonJS shim for uuid that uses Node.js built-in crypto.
// Needed because uuid@13 is pure-ESM and Jest runs in CommonJS mode.
const { randomUUID } = require("node:crypto");
module.exports = {
	v4: randomUUID,
	v1: randomUUID,
	v3: randomUUID,
	v5: randomUUID,
};
