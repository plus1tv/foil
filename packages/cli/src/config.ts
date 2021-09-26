import { resolve, join, isAbsolute } from 'path';
import { existsSync } from 'fs';

let config = {
    // Default author for foil posts.
    author: {
        name: 'Alain Galvan',
        email: 'hi@alain.xyz',
        url: 'https://alain.xyz/libraries/foil'
    },

    // Tags for this page/xml.
    tags: ['programming'],

    // Cover URL for this portfolio's default page.
    cover: '',

    // Description of this portfolio
    description: '',

    // Default files that are served statically.
    files: ['assets/*'],

    // Redirect any portfolio permalinks to this address. { from: '', to: '' }
    redirects: [],

    // The current directory for searching for foil modules.
    rootDir: resolve('.')
};

let jsonPath = join(resolve('.'), 'foil.json');
if (existsSync(jsonPath)) {
    console.log('⚙️ Found foil.json file.');
    let newDefaults = require(jsonPath);
    config = { ...config, ...newDefaults };

    if (!isAbsolute(config.rootDir)) {
        config.rootDir = join(resolve('.'), config.rootDir);
    }
}

export { config };
