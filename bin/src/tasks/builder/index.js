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
exports.build = exports.testLoader = void 0;
const chalk_1 = require("chalk");
const utils_1 = require("./utils");
const loaders_1 = require("./loaders");
let loaders = [loaders_1.ts, loaders_1.blog, loaders_1.book];
function testLoader(loader, foilModule) {
    return Object.keys(loader.test).reduce((prev, cur) => {
        let reg = new RegExp(loader.test[cur]);
        return prev || reg.test(foilModule[cur]);
    }, false);
}
exports.testLoader = testLoader;
function compile(loaders, foilModule) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let rule of loaders) {
            if (testLoader(rule, foilModule)) {
                try {
                    foilModule = yield rule.transform(foilModule);
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
        return foilModule;
    });
}
function build(foils) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('📦 Foil Database Builder:');
        for (var foil of foils) {
            if (foil) {
                console.log('⚪ Processing ' + (0, chalk_1.yellow)(`'${foil.permalink}'`) + ':');
                let compiledModule = yield compile(loaders, foil);
                yield (0, utils_1.writeToDb)(compiledModule);
            }
        }
    });
}
exports.build = build;
//# sourceMappingURL=index.js.map