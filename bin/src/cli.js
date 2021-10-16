#!/usr/bin/env node
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
exports.foil = void 0;
const chalk_1 = require("chalk");
const env_1 = require("./env");
const package_json_1 = require("../package.json");
console.log((0, chalk_1.cyan)('✨ Foil v' + package_json_1.version) +
    (0, chalk_1.gray)(env_1.isProduction ? ' (production)' : ' (development)'));
const config_1 = require("./config");
const resolve_foils_1 = __importDefault(require("./resolve-foils"));
const watcher_1 = require("./watcher");
const runner_1 = require("./runner");
function foil() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('👋 Hi ' + config_1.config.author.name + '!');
        let foils = yield (0, resolve_foils_1.default)();
        if (foils.length > 0) {
            console.log((0, chalk_1.gray)('🎡 Processing ' + foils.length + ' files.'));
        }
        if (env_1.isWatch) {
            const watcher = new watcher_1.Watcher();
            yield watcher.watch(foils);
        }
        else if (foils.length > 0) {
            const runner = new runner_1.Runner();
            yield runner.run(foils);
        }
        else {
            console.log((0, chalk_1.gray)('👍 No changes found, exiting.'));
        }
        return process.exit();
    });
}
exports.foil = foil;
foil();
//# sourceMappingURL=cli.js.map