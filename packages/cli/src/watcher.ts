import { isAbsolute, join } from 'path';
import { existsSync, statSync } from 'fs';
import { fileSync } from 'find';
import globToRegExp from 'glob-to-regexp';
import { toList } from 'dependency-tree';
import { config } from './config';

function watch() {
    // Find all package.json files
    let packages = fileSync(/\package.json$/, config.rootDir);
    packages = packages.filter(cur => !cur.match(/node_modules/));
}
