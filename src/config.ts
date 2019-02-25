import * as path from 'path';
import * as fs from 'fs';

let Defaults = {
    //default author
    author: {
        name: 'Foil Folio',
        email: 'hello@foilfoilio.com',
        url: 'https://foilfolio.com'
    },

    //default files
    files: [ 'assets/*' ],

    rootDir: path.resolve('.')
};

let jsonPath = path.join(path.resolve('.'), 'foilfolio.json');
if (fs.existsSync(jsonPath)) {
    console.log("⚙️ Found foilfolio.json file.")
    let newDefaults = require(jsonPath);
    Defaults = { ...Defaults, ...newDefaults };

    if (!path.isAbsolute(Defaults.rootDir)) {
        Defaults.rootDir = path.join(path.resolve('.'), Defaults.rootDir);
    }
}

export { Defaults };
