import markademic from 'markademic';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

import { Loader } from '../../../types';

export let blog: Loader = {
    // 💉 a test object that's used to compare with the `package.json` file.
    test: { permalink: /^\/(blog|research|libraries|notes)/ },

    // 🚒 the function that takes in the package data and lets you modify it.
    transform: async (foil) => {
        console.log('📝 Blog Transformer\n');

        // 🦜 Setup Markademic Compilation
        let mdFile = null;
        for (let file of foil.meta.files) {
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

        let bibPath = join(foil.meta.rootPath, 'bib.json');
        if (existsSync(bibPath)) {
            console.log('Found Bibliography!');
            config['citations'] = require(bibPath);
        }

        var article = markademic(config);

        // 🎧 Setup Audioblog Data (Optional)
        var audioFile = null;
        for (let file of foil.meta.files) {
            if (/\.mp3$/.exec(file.path)) {
                audioFile = file.path.substr(foil.meta.rootPath.length).replace(/\\/g, '/');
            }
        }
        var captions: { time: number; highlight: { begin: number; end: number }[] }[] = [];
        var captionsPath = join(foil.meta.rootPath, 'captions.json');
        if (existsSync(captionsPath)) {
            captions = require(captionsPath).captions;
            if (Array.isArray(captions)) {
                captions = [];
            }
        }


        // 💾 Finalize Data
        var data = {
            article,
            audio: {
                file: audioFile,
                captions
            }
        };

        if (typeof foil['data'] === 'object') {
            data = { ...foil.data, article };
        }

        return {
            ...foil,
            data
        };
    }
};
