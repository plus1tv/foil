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
exports.writeToDb = exports.getDatabaseFiles = exports.makePermalink = exports.getAsset = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const find_1 = __importDefault(require("find"));
const db_1 = require("../../db");
const chalk_1 = require("chalk");
function getAsset(file, permalink, image = 'cover') {
    let dir = path_1.default.dirname(file);
    let c = find_1.default.fileSync(new RegExp(image + '.(png|jpg|jpeg|gif)$', 'mg'), dir);
    return c.length > 0
        ? path_1.default.join(permalink, path_1.default.relative(dir, c[0])).replace(/\\/g, '/')
        : '';
}
exports.getAsset = getAsset;
function makePermalink(file, root) {
    let lastPath = path_1.default.basename(file).match(/^index/)
        ? path_1.default.dirname(file)
        : path_1.default.join(path_1.default.dirname(file), path_1.default.basename(file).replace(/\..+$/, ''));
    return path_1.default.join('/', path_1.default.relative(root, lastPath)).replace(/\\/g, '/');
}
exports.makePermalink = makePermalink;
function getDatabaseFiles(rootPath) {
    return __awaiter(this, void 0, void 0, function* () {
        var data = yield new Promise((res, rej) => {
            db_1.database
                .then((client) => __awaiter(this, void 0, void 0, function* () {
                let db = client.db('db');
                var c = db.collection('portfolio');
                c.find({ 'meta.rootPath': rootPath })
                    .toArray()
                    .then(d => res(d))
                    .catch(e => rej(e));
            }))
                .catch(reason => console.error(reason));
        });
        if (data.length < 1)
            return [];
        else
            return data[0].meta.files;
    });
}
exports.getDatabaseFiles = getDatabaseFiles;
function writeToDb(foil) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db_1.database.then((client) => __awaiter(this, void 0, void 0, function* () {
            let db = client.db('db');
            var redirectCollection = db.collection('redirect');
            let ignoredTypes = ['tsx', 'ts', 'scss', 'md', 'json', 'lock', 'db'];
            var staticFiles = find_1.default
                .fileSync(foil.meta.rootPath)
                .filter(f => !(ignoredTypes.reduce((prev, cur) => prev || f.endsWith(cur), false) || f.match(/node_modules|diary/)));
            for (var sf of staticFiles) {
                var filePermalink = path_1.default
                    .join(foil.rootPermalink, path_1.default.relative(foil.meta.rootPath, sf))
                    .replace(/\\/g, '/');
                let query = {
                    to: sf
                };
                let update = {
                    from: filePermalink,
                    to: sf,
                    dateModified: fs_1.default.statSync(sf).mtime
                };
                let options = {
                    upsert: true
                };
                yield redirectCollection
                    .updateOne(query, { $set: update }, options)
                    .then(r => { })
                    .catch(e => console.log(e));
            }
            if (staticFiles.length > 0) {
                console.log((0, chalk_1.gray)(`📒 Indexed ${staticFiles.length} static file${staticFiles.length == 1 ? '' : 's'}.`));
            }
            var portfolioCollection = db.collection('portfolio');
            yield portfolioCollection
                .updateOne({ permalink: foil.permalink }, { $set: foil }, { upsert: true })
                .then(r => console.log(`Added ${(0, chalk_1.cyan)(foil.title)} to the Database.`))
                .catch(e => console.log(e));
        }));
    });
}
exports.writeToDb = writeToDb;
//# sourceMappingURL=utils.js.map