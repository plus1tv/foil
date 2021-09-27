#!/usr/bin/env node
/**
 * ✨ Foil
 * A sparkly shiny portfolio management system.
 * 📚 Populate your database with relevant metadata from your portfolio.
 */

import { cyan, gray } from 'chalk';
import { isProduction, isWatch } from './env';
import { version } from '../package.json';

console.log(
    cyan('✨ Foil v' + version) +
        gray(isProduction ? ' (production)' : ' (development)')
);

// 🏁 Let's get started...

import { config } from './config';
import resolveFoils from './resolve-foils';
import { Watcher } from './watcher';
import { Runner } from './runner';
import { Post } from './types';

export async function foil() {
    console.log('👋 Hi ' + config.author.name + '!');

    // 📃 Gather all modified Foil modules
    let foils: Post[] = await resolveFoils();

    if (foils.length > 0) {
        console.log(gray('🎡 Processing ' + foils.length + ' files.'));
    }

    if (isWatch) {
        // 👓 Watch for changes
        const watcher = new Watcher();
        await watcher.watch(foils);
    } else if (foils.length > 0) {
        // 🏃‍♂️ Run once
        const runner = new Runner();
        await runner.run(foils);
    } else {
        console.log(gray('👍 No changes found, exiting.'));
    }

    return process.exit();
}

foil();
