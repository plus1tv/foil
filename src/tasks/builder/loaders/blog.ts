import markademic from 'markademic';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

import { Loader } from '../types';

export let blog: Loader = {
    // 💉 a test object that's used to compare with the `package.json` file.
    test: { permalink: /^\/(blog|research|libraries)/ },

    // 🚒 the function that takes in the package data and lets you modify it.
    transform: async (foil) => {
        console.log('📝 Blog Transformer\n');
        let mdFile = null;

        for (let file of foil.files) {
            if (/\.md$/.exec(file.path)) {
                mdFile = file;
            }
        }

        if (!mdFile) {
            //throw new Error("There's no .md file available in this foilfolio post.");
            return foil;
        }

        var config = {
            input: readFileSync(mdFile.path).toString(),
            rerouteLinks: (link) => join(foil.rootPermalink, link)
        };

        let bibPath = join(foil.rootPath, 'bib.json');
        if (existsSync(bibPath)) {
            console.log('Found Bibliography!');
            config['citations'] = require(bibPath);
        }

        var data = markademic(config);

        return {
            ...foil,
            data
        };
    }
};
