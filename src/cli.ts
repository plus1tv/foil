#!/usr/bin/env node
/**
 * ✨ Foilfolio v0.1.0
 * A sparkly shiny portfolio management system.
 * 📚 Populate your MongoDB database with relevant metadata from your portfolio.
 */

import { red, cyan, green, gray } from 'chalk';
import buildScripts from './tasks';
import { isProduction } from './env';

export async function foilfolio() {
    // Start Build Process
    console.log(
        cyan('✨ Foilfolio v0.1.0') +
            (isProduction ? ' (production)' : ' (development)')
    );

    // Run each task
    var scripts = Object.values(buildScripts);

    for (var i = 0; i < scripts.length; i++) {
        let progress = `(${i + 1}/${scripts.length})`;

        console.log(`\n👟 ${gray(` Running Task ${progress}...`)}\n`);

        await scripts[i]()
            .then(_ => {
                console.log(`\n✔️️ ${green(` Finished Task ${progress}!`)}\n`);
            })
            .catch(err => {
                console.log(`\n❌ ${red(` Failed Task ${progress}!`)}\n`);
                console.error(err);
            });
    }
    console.log(
        '\n💮 ' + gray(` Finished processing ${scripts.length} tasks!\n`)
    );

    return process.exit();
}

foilfolio();
