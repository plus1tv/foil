import * as path from 'path';
import * as fs from 'fs';
import * as find from 'find';
import * as globToRegExp from 'glob-to-regexp';
import { yellow } from 'chalk';

import { Defaults } from '../../config';
import { Post, BuildState, Loader } from './types';

import { getAsset, getDatabaseFiles, writeToDb } from './utils';

/**
 * Builds a list of foilfolio files. Used to check if a foilfolio entry has been updated.
 * @param rootPath The root file path.
 * @param foilFiles A list of foilfolio file path / modified combo 
 * @param otherFiles A list of path strings
 */
export function buildFoilFiles(
    rootPath: string,
    otherFiles: string[],
    foilFiles: { path: string; modified: Date }[] = []
) {
    for (let m of otherFiles) {
        let filePath = m;
        if (!path.isAbsolute(m)) {
            m = path.join(rootPath, m);
        }
        m.replace(/\\/g, '/');
        let foilFile = {
            path: m,
            modified: new Date()
        };

        if (fs.existsSync(m)) {
            foilFile.modified = fs.statSync(m).mtime;
            if (!fs.statSync(m).isDirectory()) {
                foilFiles.push(foilFile);
            }
        }
    }

    return [ ...foilFiles ];
}

/**
 * Will attempt to foilify a package.json, or return null if we're unable to do so.
 * @param packagePath path to a package.json that includes a "foil" paramter.
 */
export function foilify(packagePath: string): Post {
    let {
        description,
        author = Defaults.author,
        contributors = [],
        keywords = [],
        main,
        files = [],
        foil
    } = require(packagePath);

    if (!foil) {
        return null;
    }

    let authors = [];

    let checkAuthor = (author) => {
        let curAuthor = {
            name: '',
            email: '',
            url: ''
        };

        if (typeof author === 'string') {
            let name = /[\w\s]*(?![\<\(])/.exec(author);
            if (name) curAuthor.name = name[0];

            let email = /(?!\<)\w*(?=\>)/.exec(author);
            if (email) curAuthor.email = email[0];

            let url = /(?!\()\w*(?=\))/.exec(author);
            if (url) curAuthor.url = url[0];
        } else typeof author === 'object';
        {
            (curAuthor.name = author.name), (curAuthor.email = author.email), (curAuthor.url = author.url);
        }
        return curAuthor;
    };

    // Build list of Authors
    if (contributors.length <= 0) authors.push(checkAuthor(author));
    else {
        for (let contributor of contributors) {
            authors.push(checkAuthor(contributor));
        }
    }

    let rootPath = path.join(packagePath, '..');
    let { permalink } = foil;
    
    if (!permalink) {
        console.warn('Foil package has no permalink! Foilfolio needs a permalink to resolve routes!');
        return null;
    }

    if (permalink.charAt(0) == '/') {
        console.warn('Foil package has an invalid permalink. Permalinks cannot start with /');
        return null;
    }

    permalink = '/' + permalink;
    
    let rootPermalink = permalink;
    
    if (/\*$/.exec(permalink)) {
        rootPermalink = permalink.replace(/\*$/, '');
    }

    let {
        datePublished = new Date().toISOString(),
        cover = getAsset(packagePath, rootPermalink),
        icon = getAsset(packagePath, rootPermalink, 'icon')
    } = foil;



    // Files this package uses as inputs for later loaders
    let packageFilesSet = new Set<string>();
    packageFilesSet.add(packagePath);

    if (main) {
        packageFilesSet.add(main);
    }

    for (let file of files) {
        if (/\*/.exec(file) === null) {
            packageFilesSet.add(file);
        } else {
            let otherFiles = find.fileSync(globToRegExp(file), Defaults.rootDir);
            for (let otherFile of otherFiles) {
                packageFilesSet.add(otherFile);
            }
        }
    }

    let packageFiles = Array.from(packageFilesSet);

    let foilFiles = buildFoilFiles(rootPath, packageFiles);

    let dateModified = foilFiles.reduce((prev, cur) => (prev.modified > cur.modified ? prev : cur), {
        modified: new Date('1970-01-01Z00:00:00:000')
    }).modified;

    let foilModule = {
        ...foil,
        description,
        authors,
        keywords,
        permalink,
        datePublished: new Date(datePublished),
        dateModified,
        cover,
        icon,
        main,

        //dependent files
        files: foilFiles,

        //root path
        rootPath,
        rootPermalink
    };

    return foilModule;
}

/**
 * Executes Alain.xyz's Package building system.
 * @param loaders An array of Loaders.
 */
export default async function builder(loaders: Loader[]) {
    console.log('🌟 ' + yellow('Foilfolio Package Builder\n'));

    // Find all package.json files
    let packages = find.fileSync(/\package.json$/, Defaults.rootDir);
    packages = packages.filter((cur) => !cur.match(/node_modules/));

    var modifiedFiles = new Set<string>();
    for (var pack of packages) {
        // Import package.json and set some defaults
        let foil = foilify(pack);

        // ✨ If it's a foil module, compile it with loaders
        if (foil) {
            console.log('⚪ Processing ' + pack + '\n');
            let shouldCompile = false;

            var databaseFiles: { path: string; modified: Date }[] = await getDatabaseFiles(foil.rootPath);
            shouldCompile = shouldCompile || databaseFiles.length < 1;

            // 🦨 check if existing file has been modified
            for (let databaseFile of databaseFiles) {
                if (fs.existsSync(databaseFile.path)) {
                    shouldCompile =
                        shouldCompile ||
                        fs.statSync(databaseFile.path).mtime.getTime() !== databaseFile.modified.getTime();
                    if (shouldCompile) break;
                }
            }

            //🐣 check if there's any new files, or files that have been renamed
            if (!shouldCompile) {
                for (let file of foil.files) {
                    let matchingFile = false;
                    for (let databaseFile of databaseFiles) {
                        matchingFile = matchingFile || file.path == databaseFile.path;
                        if (matchingFile) break;
                    }

                    shouldCompile = shouldCompile || !matchingFile;
                }
            }

            if (shouldCompile) {
                let compiledModule = await compile({loaders, modifiedFiles}, foil);
                await writeToDb(compiledModule);
                for (var file of foil.files)
                {
                    modifiedFiles.add(file.path);
                }
            }
        }
    }
}

/**
 * Compiles foil module by waterfalling through loaders.
 * @param loaders A matching algorithm and a compiler function.
 * @param foilModule Current foil module.
 */
async function compile(state: BuildState, foilModule: Post) {
    // Check each loader for a match
    for (let rule of state.loaders) {
        // Perform deep comparison
        let compare = Object.keys(rule.test).reduce((prev, cur) => {
            let reg = new RegExp(rule.test[cur]);
            return prev || reg.test(foilModule[cur]);
        }, false);

        if (compare) {
            try {
                foilModule = await rule.transform(foilModule, state.modifiedFiles);
            } catch (e) {
                console.error(e);
            }
        }
    }

    return foilModule;
}
