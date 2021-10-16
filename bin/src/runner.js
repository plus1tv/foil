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
exports.Runner = void 0;
const tasks_1 = __importDefault(require("./tasks"));
const chalk_1 = require("chalk");
class Runner {
    run(foils) {
        return __awaiter(this, void 0, void 0, function* () {
            var scripts = Object.values(tasks_1.default);
            for (var i = 0; i < scripts.length; i++) {
                let progress = `(${i + 1}/${scripts.length})`;
                console.log(`\n👟 ${(0, chalk_1.gray)(` Running Task ${progress}...`)}`);
                yield scripts[i](foils)
                    .then(_ => {
                    console.log(`✔️️ ${(0, chalk_1.green)(` Finished Task ${progress}!`)}`);
                })
                    .catch(err => {
                    console.log(`\n❌ ${(0, chalk_1.red)(` Failed Task ${progress}!`)}`);
                    console.error(err);
                });
            }
            console.log('\n💮 ' + (0, chalk_1.gray)(` Finished processing ${scripts.length} tasks!\n`));
        });
    }
}
exports.Runner = Runner;
//# sourceMappingURL=runner.js.map