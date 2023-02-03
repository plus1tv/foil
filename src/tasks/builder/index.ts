import * as fs from 'fs';
import chalk from 'chalk';
const { yellow } = chalk;

import { getAsset, getDatabaseFiles, writeToDb } from './utils';
import { ts, blog, book } from './loaders';
import { Post, Loader } from '../../types';
/**
 * Loaders waterfall through, and performs a deep search on the loader. If the package matches,
 * The loader will execute, modifying the data along the way.
 */
let loaders = [ts, blog, book];

export function testLoader(loader, foilModule) {
    return Object.keys(loader.test).reduce((prev, cur) => {
        let reg = new RegExp(loader.test[cur]);
        return prev || reg.test(foilModule[cur]);
    }, false);
}

/**
 * Compiles foil module by waterfalling through loaders.
 * @param loaders A matching algorithm and a compiler function.
 * @param foilModule Current foil module.
 */
async function compile(loaders: Loader[], foilModule: Post) {
    // Check each loader for a match
    for (let rule of loaders) {
        if (testLoader(rule, foilModule)) {
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
    console.log('📦 Foil Database Builder:');
    for (var foil of foils) {
        // If it's a foil module, compile it with loaders
        if (foil) {
            console.log('⚪ Processing ' + yellow(`'${foil.permalink}'`) + ':');

            let compiledModule = await compile(loaders, foil);
            await writeToDb(compiledModule);
        }
    }
}
