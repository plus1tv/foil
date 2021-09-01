import { argv } from 'process';

let env = process.env['NODE_ENV'];
let isProduction =
    (env && env.match(/production/)) ||
    argv.reduce((prev, cur) => prev || cur === '--production', false);

export { isProduction };
