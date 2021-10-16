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
exports.Watcher = void 0;
const chalk_1 = require("chalk");
const resolve_foils_1 = __importDefault(require("./resolve-foils"));
const runner_1 = require("./runner");
var WatcherState;
(function (WatcherState) {
    WatcherState[WatcherState["Initial"] = 0] = "Initial";
    WatcherState[WatcherState["Watching"] = 1] = "Watching";
    WatcherState[WatcherState["Processing"] = 2] = "Processing";
    WatcherState[WatcherState["Done"] = 3] = "Done";
})(WatcherState || (WatcherState = {}));
class Watcher {
    constructor() {
        this.watch = (startFoils) => __awaiter(this, void 0, void 0, function* () {
            let state = WatcherState.Initial;
            const runner = new runner_1.Runner();
            let foils = [];
            const stateMachine = () => __awaiter(this, void 0, void 0, function* () {
                switch (+state) {
                    case WatcherState.Initial: {
                        if (startFoils.length > 0) {
                            yield runner.run(startFoils);
                        }
                        console.log((0, chalk_1.gray)('\n👀  · Watching for changes... · \n'));
                        state = WatcherState.Watching;
                        break;
                    }
                    case WatcherState.Watching: {
                        foils = yield (0, resolve_foils_1.default)();
                        if (foils.length > 0) {
                            state = WatcherState.Processing;
                        }
                        break;
                    }
                    case WatcherState.Processing: {
                        if (foils.length > 0) {
                            yield runner.run(foils);
                        }
                        state = WatcherState.Done;
                        break;
                    }
                    case WatcherState.Done: {
                        console.log((0, chalk_1.gray)('\n👀  · Watching for changes... · \n'));
                        state = WatcherState.Watching;
                        break;
                    }
                }
                yield stateMachine();
            });
            yield stateMachine();
        });
    }
}
exports.Watcher = Watcher;
//# sourceMappingURL=watcher.js.map