import { argv } from 'process';

let env = process.env['NODE_ENV'];
let isProduction =
    (env && env.match(/production/)) ||
    argv.reduce((prev, cur) => prev || cur === '--production', false);

let isWatch = argv.reduce((prev, cur) => prev || cur === '--watch', false);

let reset = argv.reduce((prev, cur) => prev || cur === 'reset', false);

export { reset, isProduction, isWatch };
