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
Object.defineProperty(exports, "__esModule", { value: true });
exports.clean = void 0;
const fs_1 = require("fs");
const chalk_1 = require("chalk");
const db_1 = require("../db");
const path_1 = require("path");
function clean(_foils) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🌊 Foil Database Cleaner:');
        yield db_1.database.then((client) => __awaiter(this, void 0, void 0, function* () {
            let db = client.db('db');
            var redirectCol = db.collection('redirect');
            var portfolioCol = db.collection('portfolio');
            var cleanFiles = (col) => col
                .find({})
                .toArray()
                .catch(err => console.error(err))
                .then(res => {
                if (res)
                    for (var f of res) {
                        let { _id, permalink = null } = f;
                        let files = f.to ? [{ path: f.to }] : f.meta.files;
                        for (let file of files) {
                            let deleteThis = () => {
                                col.deleteOne({ _id })
                                    .catch(err => console.error(err))
                                    .then(() => console.log('❌ Removed ' + file.path));
                            };
                            if (/\.([A-z])*$/.test(file.path))
                                (0, fs_1.stat)(file.path, stats => {
                                    if ((stats === null || stats === void 0 ? void 0 : stats.code) === 'ENOENT') {
                                        deleteThis();
                                    }
                                    if (stats &&
                                        (0, path_1.basename)(file.path) ==
                                            'package.json') {
                                        if (permalink) {
                                            let pack = require(file.path);
                                            if (pack.foil &&
                                                '/' +
                                                    pack.foil.permalink !==
                                                    permalink) {
                                                console.log('Permalink ' +
                                                    permalink +
                                                    ' does not match ' +
                                                    pack.foil
                                                        .permalink +
                                                    ', deleting.');
                                                deleteThis();
                                            }
                                        }
                                    }
                                });
                        }
                    }
            });
            yield cleanFiles(redirectCol);
            console.log(`🧼 Cleaned ${(0, chalk_1.cyan)("'files'")} collection.`);
            yield cleanFiles(portfolioCol);
            console.log(`🧼 Cleaned ${(0, chalk_1.cyan)("'portfolio'")} collection.`);
        }));
    });
}
exports.clean = clean;
//# sourceMappingURL=clean.js.map