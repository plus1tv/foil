"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.foilify = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const find_1 = require("find");
const glob_to_regexp_1 = __importDefault(require("glob-to-regexp"));
const dependency_tree_1 = require("dependency-tree");
const config_1 = require("./config");
const utils_1 = require("./tasks/builder/utils");
function buildFoilFiles(rootPath, otherFiles, foilFiles = []) {
    for (let m of otherFiles) {
        if (!(0, path_1.isAbsolute)(m)) {
            m = (0, path_1.join)(rootPath, m);
        }
        m.replace(/\\/g, '/');
        let foilFile = {
            path: m,
            modified: new Date()
        };
        if ((0, fs_1.existsSync)(m)) {
            foilFile.modified = (0, fs_1.statSync)(m).mtime;
            if (!(0, fs_1.statSync)(m).isDirectory()) {
                foilFiles.push(foilFile);
            }
        }
    }
    return [...foilFiles];
}
function foilify(packagePath) {
    let { description, author = config_1.config.author, contributors = [], keywords = [], main, files = [], foil } = require(packagePath);
    if (!foil) {
        return null;
    }
    let authors = [];
    let checkAuthor = author => {
        let curAuthor = {
            name: '',
            email: '',
            url: ''
        };
        if (typeof author === 'string') {
            let name = /[\w\s]*(?![\<\(])/.exec(author);
            if (name)
                curAuthor.name = name[0];
            let email = /(?!\<)\w*(?=\>)/.exec(author);
            if (email)
                curAuthor.email = email[0];
            let url = /(?!\()\w*(?=\))/.exec(author);
            if (url)
                curAuthor.url = url[0];
        }
        else
            typeof author === 'object';
        {
            (curAuthor.name = author.name),
                (curAuthor.email = author.email),
                (curAuthor.url = author.url);
        }
        return curAuthor;
    };
    if (contributors.length <= 0)
        authors.push(checkAuthor(author));
    else {
        for (let contributor of contributors) {
            authors.push(checkAuthor(contributor));
        }
    }
    let rootPath = (0, path_1.join)(packagePath, '..');
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
    let { datePublished = new Date().toISOString(), cover = (0, utils_1.getAsset)(packagePath, rootPermalink), icon = (0, utils_1.getAsset)(packagePath, rootPermalink, 'icon') } = foil;
    let packageFilesSet = new Set();
    packageFilesSet.add(packagePath);
    if (main) {
        packageFilesSet.add(main);
        if (main.match(/\.(t|j)sx?$/)) {
            let filename = main;
            if (!(0, path_1.isAbsolute)(filename)) {
                filename = (0, path_1.join)(rootPath, filename);
            }
            if ((0, fs_1.existsSync)(filename)) {
                let dependencies = (0, dependency_tree_1.toList)({
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
        }
        else {
            let otherFiles = (0, find_1.fileSync)((0, glob_to_regexp_1.default)(file), config_1.config.currentDir);
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
    let { publicDateModifiedFiles = ['.md$'] } = foil;
    let publicDateModified = new Date('1970-01-01Z00:00:00:000');
    if (publicDateModifiedFiles.length > 0) {
        for (let cur of foilFiles) {
            if (publicDateModifiedFiles.reduce((p, c) => p || new RegExp(c).test(cur.path), false)) {
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
    if (sanitizedDatePublished.getDate() === NaN) {
        console.warn('📅 Provided publish date is invalid, replacing with today: ' +
            datePublished);
        sanitizedDatePublished = new Date();
    }
    let foilModule = Object.assign(Object.assign({}, foil), { description,
        authors,
        keywords,
        permalink,
        rootPermalink, datePublished: sanitizedDatePublished, dateModified: publicDateModified, cover,
        icon,
        main, meta: {
            files: foilFiles,
            dateModified,
            rootPath
        } });
    return foilModule;
}
exports.foilify = foilify;
function resolveFoils() {
    return __awaiter(this, void 0, void 0, function* () {
        let foils = [];
        let packages = (0, find_1.fileSync)(/\package.json$/, config_1.config.currentDir);
        packages = packages.filter(cur => !cur.match(/node_modules/));
        for (var pack of packages) {
            let foil = foilify(pack);
            if (foil) {
                let shouldCompile = false;
                var databaseFiles = yield (0, utils_1.getDatabaseFiles)(foil.meta.rootPath);
                shouldCompile =
                    shouldCompile ||
                        databaseFiles.length <= 0 ||
                        databaseFiles.length !== foil.meta.files.length;
                if (!shouldCompile) {
                    for (let databaseFile of databaseFiles) {
                        if ((0, fs_1.existsSync)(databaseFile.path)) {
                            shouldCompile =
                                shouldCompile ||
                                    (0, fs_1.statSync)(databaseFile.path).mtime.getTime() !==
                                        databaseFile.modified.getTime();
                            if (shouldCompile)
                                break;
                        }
                    }
                    if (!shouldCompile) {
                        for (let file of foil.meta.files) {
                            let matchingFile = false;
                            for (let databaseFile of databaseFiles) {
                                matchingFile =
                                    matchingFile || file.path == databaseFile.path;
                                if (matchingFile)
                                    break;
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
    });
}
exports.default = resolveFoils;
//# sourceMappingURL=resolve-foils.js.map