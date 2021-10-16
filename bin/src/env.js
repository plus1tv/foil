"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWatch = exports.isProduction = void 0;
const process_1 = require("process");
let env = process.env['NODE_ENV'];
let isProduction = (env && env.match(/production/)) ||
    process_1.argv.reduce((prev, cur) => prev || cur === '--production', false);
exports.isProduction = isProduction;
let isWatch = process_1.argv.reduce((prev, cur) => prev || cur === '--watch', false);
exports.isWatch = isWatch;
//# sourceMappingURL=env.js.map