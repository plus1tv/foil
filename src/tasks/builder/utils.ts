import fs from 'fs';
import path from 'path';
import find from 'find';
import { database } from '../../db';
import { Collection } from 'mongodb';
import { Post } from './types';

/**
 * The following are various functions to get metadata 
 * for specific attributes of the portfolio system. 
 */

/**
 * Get an asset of a particular name (Whatever Format, from a given file path)
 */
export function getAsset(file: string, permalink: string, image = 'cover') {
    let dir = path.dirname(file);
    let c = find.fileSync(new RegExp(image + '.(png|jpg|jpeg|gif)$', 'mg'), dir);
    return c.length > 0 ? path.join(permalink, path.relative(dir, c[0])).replace(/\\/g, '/') : '';
}

/**
 * Create a Permalink from a given path string.
 */
export function makePermalink(file: string, root: string) {
    let lastPath = path.basename(file).match(/^index/)
        ? path.dirname(file)
        : path.join(path.dirname(file), path.basename(file).replace(/\..+$/, ''));
    return path.join('/', path.relative(root, lastPath)).replace(/\\/g, '/');
}

/**
 * Check if a given file is in the database and the current file is modified.
 */
export async function getDatabaseFiles(rootPath: string) {
    var data = await new Promise<any[]>((res, rej) => {
        database
            .then(async (client: any) => {
                let db = client.db('db');
                var c = db.collection('portfolio');

                // Check if the default permalink is in the database.
                c.find({ rootPath }).toArray().then((d) => res(d)).catch((e) => rej(e));
            })
            .catch((reason) => console.error(reason));
    });

    if (data.length < 1) return [];
    else return data[0].files;
}

/**
 * Write a given set of answers to the database.
 */
export async function writeToDb(foil: Post) {
    await database.then(async (client) => {
        let db = client.db('db');

        var redirectCollection: Collection = db.collection('redirect');

        // ⚡ Index static files in foilfolio directory
        let ignoredTypes = [ 'tsx', 'ts', 'scss', 'md', 'json', 'lock', 'db' ];

        var staticFiles = find
            .fileSync(foil.rootPath)
            .filter(
                (f) => !(ignoredTypes.reduce((prev, cur) => prev || f.endsWith(cur), false) || f.match(/node_modules|diary/))
            );

        // Add Static files to database
        for (var sf of staticFiles) {
            var filePermalink = path.join(foil.rootPermalink, path.relative(foil.rootPath, sf)).replace(/\\/g, '/');

            let query = {
                to: sf
            };

            let update = {
                from: filePermalink,
                to: sf,
                dateModified: fs.statSync(sf).mtime
            };

            let options = {
                upsert: true
            };

            await redirectCollection
                .updateOne(query, { $set: update }, options)
                .then((r) => console.log(`Updated file ${sf}.`))
                .catch((e) => console.log(e));
        }

        // 💖 Add foil module to database
        var portfolioCollection: Collection = db.collection('portfolio');
        await portfolioCollection
            .updateOne({ permalink: foil.permalink }, { $set: foil }, { upsert: true })
            .then((r) => console.log(`Added ${foil.title} to the Database.`))
            .catch((e) => console.log(e));
    });
}
