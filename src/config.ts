import * as path from 'path';

export const RootDir = path.join(__dirname, '..');

export const Defaults = {
    //default author
    author: {
        name: 'Alain Galvan',
        email: 'hi@alain.xyz',
        url: 'https://alain.xyz'
    },

    //default files
    files: ["assets/*"]
};