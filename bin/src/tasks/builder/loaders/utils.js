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
exports.checkUpdated = void 0;
const db_1 = require("../../../db");
const fs_1 = require("fs");
function checkUpdated(path) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, fs_1.existsSync)(path)) {
            return true;
        }
        return yield db_1.database.then((client) => __awaiter(this, void 0, void 0, function* () {
            let db = client.db('db');
            let portfolioCol = db.collection('portfolio');
            let portfolioItems = yield portfolioCol
                .find({
                'meta.files.path': path
            })
                .project({
                'meta.files': 1
            })
                .limit(1)
                .toArray();
            if (typeof portfolioItems === 'object' && portfolioItems.length >= 1) {
                var { mtime } = (0, fs_1.statSync)(path);
                for (let file of portfolioItems[0].meta.files) {
                    if (file.path === path) {
                        return (mtime.getDate() === new Date(file.modified).getDate());
                    }
                }
            }
            let redirectCol = db.collection('redirect');
            let redirectItems = yield redirectCol
                .find({
                to: path
            })
                .limit(1)
                .toArray();
            if (typeof redirectItems === 'object' && redirectItems.length >= 1) {
                var { mtime } = (0, fs_1.statSync)(path);
                let hasModified = mtime.getDate() ===
                    new Date(redirectItems[0].dateModified).getDate();
                return hasModified;
            }
            return true;
        }));
    });
}
exports.checkUpdated = checkUpdated;
//# sourceMappingURL=utils.js.map