import * as path from 'path';
import * as fs from 'fs';

let config = {
    //default author
    author: {
        name: 'Alain Galvan',
        email: 'hi@alain.xyz',
        url: 'https://alain.xyz/libraries/foil'
    },

    tags: ['programming'],
    cover: '',
    description: '',

    //default files
    files: ['assets/*'],

    redirects: [],

    rootDir: path.resolve('.')
};

let jsonPath = path.join(path.resolve('.'), 'foilfolio.json');
if (fs.existsSync(jsonPath)) {
    console.log('⚙️ Found foilfolio.json file.');
    let newDefaults = require(jsonPath);
    config = { ...config, ...newDefaults };

    if (!path.isAbsolute(config.rootDir)) {
        config.rootDir = path.join(path.resolve('.'), config.rootDir);
    }
}

export { config };
