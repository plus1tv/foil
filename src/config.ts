import { resolve, join, isAbsolute } from 'path';
import { existsSync } from 'fs';

import { createRequire } from 'module';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

let config = {
    // Title for the host site.
    title: 'Foil',
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
    currentDir: resolve('.'),

    // Foil CLI Root
    foilCliRoot: resolve(join(__dirname)),

    // Mongo URL
    mongoUrl: 'mongodb://127.0.0.1:27017'
};

let jsonPath = join(resolve('.'), 'foil.json');
if (existsSync(jsonPath)) {
    console.log('⚙️ Found foil.json file.');
    let newDefaults = require(jsonPath);
    config = { ...config, ...newDefaults };

    if (!isAbsolute(config.currentDir)) {
        config.currentDir = join(resolve('.'), config.currentDir);
    }
}

export { config };
