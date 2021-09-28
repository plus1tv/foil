import markademic from 'markademic';
import { join, basename } from 'path';
import { readFileSync, existsSync } from 'fs';
import { checkUpdated } from './utils';

import { Loader } from '../../../types';
import { yellow } from 'chalk';

export let blog: Loader = {
    // 💉 a test object that's used to compare with the `package.json` file.
    test: { permalink: /^\/(blog|research|libraries|notes)/ },

    // 🚒 the function that takes in the package data and lets you modify it.
    transform: async foil => {
        // Find a markdown file to compile.
        let mdFile = null;
        for (let file of foil.meta.files) {
            if (/\.md$/.exec(file.path)) {
                mdFile = file;
            }
        }
        if (!mdFile) {
            return foil;
        }

        // 🦜 Setup Markademic compilation.
        let updated = checkUpdated(mdFile);
        if (updated) {
            console.log('📝 Blog Transformer:');
            var config = {
                input: readFileSync(mdFile.path).toString(),
                rerouteLinks: link => join(foil.rootPermalink, link)
            };

            let bibPath = join(foil.meta.rootPath, 'bib.json');
            if (existsSync(bibPath)) {
                config['citations'] = require(bibPath);
            }

            var article = markademic(config);
            console.log(
                '🏫 Built ' +
                    yellow(basename(mdFile.path)) +
                    ' with Markademic.'
            );
            // 🎧 Setup Audioblog Data (Optional)
            var audioFile = null;
            for (let file of foil.meta.files) {
                if (/\.mp3$/.exec(file.path)) {
                    audioFile = file.path
                        .substr(foil.meta.rootPath.length)
                        .replace(/\\/g, '/');
                }
            }
            var captions: {
                time: number;
                highlight: { begin: number; end: number }[];
            }[] = [];
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
        return foil;
    }
};
