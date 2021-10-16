"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
let config = {
    author: {
        name: 'Alain Galvan',
        email: 'hi@alain.xyz',
        url: 'https://alain.xyz/libraries/foil'
    },
    tags: ['programming'],
    cover: '',
    description: '',
    files: ['assets/*'],
    redirects: [],
    currentDir: (0, path_1.resolve)('.'),
    foilCliRoot: (0, path_1.resolve)((0, path_1.join)(__dirname, '..'))
};
exports.config = config;
let jsonPath = (0, path_1.join)((0, path_1.resolve)('.'), 'foil.json');
if ((0, fs_1.existsSync)(jsonPath)) {
    console.log('⚙️ Found foil.json file.');
    let newDefaults = require(jsonPath);
    exports.config = config = Object.assign(Object.assign({}, config), newDefaults);
    if (!(0, path_1.isAbsolute)(config.currentDir)) {
        config.currentDir = (0, path_1.join)((0, path_1.resolve)('.'), config.currentDir);
    }
}
//# sourceMappingURL=config.js.map