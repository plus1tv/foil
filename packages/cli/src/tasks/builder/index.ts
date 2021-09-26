import * as fs from 'fs';
import { yellow } from 'chalk';

import { getAsset, getDatabaseFiles, writeToDb } from './utils';
import { ts, blog, book } from './loaders';
import { Post, Loader } from '../../types';
/**
 * Loaders waterfall through, and performs a deep search on the loader. If the package matches,
 * The loader will execute, modifying the data along the way.
 */
let loaders = [ts, blog, book];

/**
 * Compiles foil module by waterfalling through loaders.
 * @param loaders A matching algorithm and a compiler function.
 * @param foilModule Current foil module.
 */
async function compile(loaders: Loader[], foilModule: Post) {
    // Check each loader for a match
    for (let rule of loaders) {
        // Perform deep comparison
        let compare = Object.keys(rule.test).reduce((prev, cur) => {
            let reg = new RegExp(rule.test[cur]);
            return prev || reg.test(foilModule[cur]);
        }, false);

        if (compare) {
            try {
                foilModule = await rule.transform(foilModule);
            } catch (e) {
                console.error(e);
            }
        }
    }

    return foilModule;
}

export async function build(foils: Post[]) {
    for (var foil of foils) {
        // If it's a foil module, compile it with loaders
        if (foil) {
            console.log(
                '⚪ Processing ' + yellow(`'${foil.permalink}'`) + ':\n'
            );

            let compiledModule = await compile(loaders, foil);
            await writeToDb(compiledModule);
        }
    }
}
