import { isAbsolute, join } from 'path';
import { existsSync, statSync } from 'fs';
import Find from 'find';
const { fileSync } = Find;
import globToRegExp from 'glob-to-regexp';
import { toList } from 'dependency-tree';

import { config } from './config';
import { Post } from './types';

import { getAsset, getDatabaseFiles } from './tasks/builder/utils';

import { createRequire } from "module";
const require = createRequire(import.meta.url);

/**
 * Builds a list of foil files. Used to check if a foil entry has been updated.
 * @param rootPath The root file path.
 * @param foilFiles A list of foil file path / modified combo
 * @param otherFiles A list of path strings
 */
function buildFoilFiles(
    rootPath: string,
    otherFiles: string[],
    foilFiles: { path: string; modified: Date }[] = []
) {
    for (let m of otherFiles) {
        if (!isAbsolute(m)) {
            m = join(rootPath, m);
        }
        m.replace(/\\/g, '/');
        let foilFile = {
            path: m,
            modified: new Date()
        };

        if (existsSync(m)) {
            foilFile.modified = statSync(m).mtime;
            if (!statSync(m).isDirectory()) {
                foilFiles.push(foilFile);
            }
        }
    }

    return [...foilFiles];
}

/**
 * Will attempt to foilify a package.json, or return null if we're unable to do so.
 * @param packagePath path to a package.json that includes a "foil" paramter.
 */
export function foilify(packagePath: string): Post {
    let {
        description,
        author = config.author,
        contributors = [],
        keywords = [],
        main,
        files = [],
        foil
    } = require(packagePath);

    if (!foil) {
        return null;
    }

    // 🧔 Build list of Authors
    let authors = [];

    let checkAuthor = author => {
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
            (curAuthor.name = author.name),
                (curAuthor.email = author.email),
                (curAuthor.url = author.url);
        }
        return curAuthor;
    };

    if (contributors.length <= 0) authors.push(checkAuthor(author));
    else {
        for (let contributor of contributors) {
            authors.push(checkAuthor(contributor));
        }
    }

    let rootPath = join(packagePath, '..');

    // 🔗 Resolve permalink of post:
    let { permalink } = foil;

    if (!permalink) {
        console.warn(
            'Foil package has no permalink! Foilfolio needs a permalink to resolve routes!'
        );
        return null;
    }

    if (permalink.charAt(0) == '/') {
        console.warn(
            'Foil package has an invalid permalink. Permalinks cannot start with /'
        );
        return null;
    }

    permalink = '/' + permalink.replace(
        /\\/gi,
        '/'
    );

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

        // 🔎 Resolve JavaScript dependencies of main file:
        // This only applies to packages outside `node_modules`,
        // While it can resolve `import` statements, CommonJS works best.
        if (main.match(/\.(t|j)sx?$/)) {
            let filename = main;
            if (!isAbsolute(filename)) {
                filename = join(rootPath, filename);
            }
            if (existsSync(filename)) {
                let dependencies = toList({
                    filename,
                    directory: rootPath,
                    filter: path => path.indexOf('node_modules') === -1,
                    nodeModulesConfig: {
                        entry: 'module'
                    },
                    tsConfig: {
                        compilerOptions: {
                            target: 'es2016',
                            module: 'CommonJS',
                            isolatedModules: true,
                            allowSyntheticDefaultImports: true,
                            noImplicitAny: false,
                            suppressImplicitAnyIndexErrors: true,
                            removeComments: true,
                            jsx: 'react'
                        },

                        transpileOnly: true
                    }
                });
                dependencies.forEach(file => packageFilesSet.add(file));
            }
        }
    }

    for (let file of files) {
        if (/\*/.exec(file) === null) {
            packageFilesSet.add(file);
        } else {
            let otherFiles = fileSync(globToRegExp(file), config.currentDir);
            for (let otherFile of otherFiles) {
                packageFilesSet.add(otherFile);
            }
        }
    }

    let packageFiles = Array.from<string>(packageFilesSet);

    let foilFiles = buildFoilFiles(rootPath, packageFiles);

    // 📅 Determine public/private modified dates, publish dates:
    let dateModified = foilFiles.reduce(
        (prev, cur) => (prev.modified > cur.modified ? prev : cur),
        {
            modified: new Date('1970-01-01Z00:00:00:000')
        }
    ).modified;

    // If there's a blog file, we'll use that file as the public modified date.
    let { publicDateModifiedFiles = ['.md$'] } = foil;
    let publicDateModified = new Date('1970-01-01Z00:00:00:000');
    if (publicDateModifiedFiles.length > 0) {
        for (let cur of foilFiles) {
            if (
                publicDateModifiedFiles.reduce(
                    (p, c) => p || new RegExp(c).test(cur.path),
                    false
                )
            ) {
                if (publicDateModified < cur.modified) {
                    publicDateModified = cur.modified;
                }
            }
        }
    }
    if (publicDateModified <= new Date('1970-01-02Z00:00:00:000')) {
        publicDateModified = dateModified;
    }

    let sanitizedDatePublished = new Date(datePublished);
    if (Number.isNaN(sanitizedDatePublished.getDate())) {
        console.warn(
            '📅 Provided publish date is invalid, replacing with today: ' +
                datePublished
        );
        sanitizedDatePublished = new Date();
    }

    // Rewrite package.json if sanitized?

    let foilModule = {
        ...foil,
        description,
        authors,
        keywords,
        permalink,
        rootPermalink,
        datePublished: sanitizedDatePublished,
        dateModified: publicDateModified,
        cover,
        icon,
        main,

        meta: {
            // Dependent files
            files: foilFiles,

            // Private Date Modified
            dateModified,

            // Root path
            rootPath
        }
    };

    return foilModule;
}

/**
 * Executes Alain.xyz's Package building system.
 * @param loaders An array of Loaders.
 */
export default async function resolveFoils() {
    let foils = [];

    // Find all package.json files
    let packages = fileSync(/\package.json$/, config.currentDir);
    packages = packages.filter(cur => !cur.match(/node_modules/));

    for (var pack of packages) {
        // Import package.json and set some defaults
        let foil = foilify(pack);

        // If it's a foil module, compile it with loaders
        if (foil) {
            let shouldCompile = false;

            var databaseFiles: { path: string; modified: Date }[] =
                await getDatabaseFiles(foil.meta.rootPath);
            shouldCompile =
                shouldCompile ||
                databaseFiles.length <= 0 ||
                databaseFiles.length !== foil.meta.files.length;
            if (!shouldCompile) {
                //check if existing file has been modified
                for (let databaseFile of databaseFiles) {
                    if (existsSync(databaseFile.path)) {
                        shouldCompile =
                            shouldCompile ||
                            statSync(databaseFile.path).mtime.getTime() !==
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
            }
            if (shouldCompile) {
                foils.push(foil);
            }
        }
    }
    return foils;
}
