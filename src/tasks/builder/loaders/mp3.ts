import * as path from 'path';
import * as find from 'find';
import * as fs from 'fs';
import * as id3 from 'id3js';

import { database } from '../../../../../backend/src/db';
import { getAsset } from '../utils';


const root = path.join(__dirname, '..', '..', 'music');

let songs = find.fileSync(/\.mp3$/, root);

for (var song of songs) {
    id3({ file: song, type: id3.OPEN_LOCAL }, (err, tags) => {
        if (err) return console.error(err);

        // Add song data to portfolio
        database.then((db) => {
            var c = db.collection('portfolio');
            let query = { file: song };
            /* 
            let entry = {
                image: getCover(song, answers.permalink),
                content: answers.permalink + '.mp3',
                mtime: fs.statSync(song).mtime,
                file: song
            }
            c.update(query, entry, { upsert: true })
            */
        });

        console.log(tags.v2);
    });
}

export default function buildMusic() {

}