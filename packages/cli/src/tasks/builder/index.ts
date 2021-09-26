import * as fs from 'fs';

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
            console.log('⚪ Processing ' + foil.meta.rootPath + '\n');
            let shouldCompile = false;

            var databaseFiles: { path: string; modified: Date }[] =
                await getDatabaseFiles(foil.meta.rootPath);
            shouldCompile = shouldCompile || databaseFiles.length < 1;

            //check if existing file has been modified
            for (let databaseFile of databaseFiles) {
                if (fs.existsSync(databaseFile.path)) {
                    shouldCompile =
                        shouldCompile ||
                        fs.statSync(databaseFile.path).mtime.getTime() !==
                            databaseFile.modified.getTime();
                    if (shouldCompile) break;
                }
            }

            //check if there's any new files, or files that have been renamed
            if (!shouldCompile) {
                for (let file of foil.meta.files) {
                    let matchingFile = false;
                    for (let databaseFile of databaseFiles) {
                        matchingFile =
                            matchingFile || file.path == databaseFile.path;
                        if (matchingFile) break;
                    }
                    shouldCompile = shouldCompile || !matchingFile;
                }
            }

            if (shouldCompile) {
                let compiledModule = await compile(loaders, foil);
                await writeToDb(compiledModule);
            }
        }
    }
}
