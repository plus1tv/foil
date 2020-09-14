import * as path from 'path';
import * as fs from 'fs';

let config = {
    //default author
    author: {
        name: 'Foil Folio',
        email: 'hello@foilfoilio.com',
        url: 'https://foilfolio.com'
    },

    //default files
    files: [ 'assets/*' ],

    redirects: [],

    rootDir: path.resolve('.')
};

let jsonPath = path.join(path.resolve('.'), 'foilfolio.json');
if (fs.existsSync(jsonPath)) {
    console.log("⚙️ Found foilfolio.json file.")
    let newDefaults = require(jsonPath);
    config = { ...config, ...newDefaults };

    if (!path.isAbsolute(config.rootDir)) {
        config.rootDir = path.join(path.resolve('.'), config.rootDir);
    }
}

export { config };
