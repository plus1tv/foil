import { isAbsolute, join } from 'path';
import { existsSync, statSync } from 'fs';
import { fileSync } from 'find';
import globToRegExp from 'glob-to-regexp';
import { toList } from 'dependency-tree';
import { config } from './config';
import { red, cyan, green, gray } from 'chalk';
import { Runner } from './runner';
import { Post } from './types';
enum WatcherState {
    Initial,
    Watching,
    Processing,
    Done
}

export class Watcher {
    watch = async (startFoils: Post[]) => {
        // Find all package.json files
        let packages = fileSync(/\package.json$/, config.rootDir);
        packages = packages.filter(cur => !cur.match(/node_modules/));
        let state = WatcherState.Initial;
        process.nextTick(() => {
            //🔎 watch for changes:
            config.rootDir;

            // 🏃‍♂️ Try running tasks if these's a change in resolved foils and compiler's not busy.

            if (state === WatcherState.Done) {
                console.log(gray('\n👀  · Watching for changes... · \n'));
            }
        });
    };
}
