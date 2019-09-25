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
        var audioFile = null;

        for (let file of foil.files) {
            if (/\.md$/.exec(file.path)) {
                mdFile = file;
            }
        }

        if (!mdFile) {
            //throw new Error("There's no .md file available in this foilfolio post.");
            return foil;
        }

        for (let file of foil.files) {
            if (/\.mp3$/.exec(file.path)) {
                audioFile = file.path.substr(foil.rootPath.length).replace(/\\/g, '/');;
            }
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

        var article = markademic(config);

        var data = {
            article,
            audio: audioFile
        };

        if (typeof foil['data'] === 'object')
        {
            data = {...foil.data, article }
        }

        return {
            ...foil,
            data
        };
    }
};
