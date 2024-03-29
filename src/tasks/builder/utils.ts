import { statSync } from 'fs';
import { readFile } from 'fs/promises';
import { dirname, join, basename, relative } from 'path';
import Find from 'find';
const { fileSync } = Find;
import { database } from '../../db';
import { Collection } from 'mongodb';
import { Post } from '../../types';
import chalk from 'chalk';
const { cyan, gray } = chalk;

/**
 * The following are various functions to get metadata
 * for specific attributes of the portfolio system.
 */

/**
 * Get an asset of a particular name (Whatever Format, from a given file path)
 */
export function getAsset(file: string, permalink: string, image = 'cover') {
    let dir = dirname(file);
    let c = fileSync(new RegExp(image + '.(png|jpg|jpeg|gif)$', 'mg'), dir);
    return c.length > 0
        ? join(permalink, relative(dir, c[0])).replace(/\\/g, '/')
        : '';
}

/**
 * Create a Permalink from a given path string.
 */
export function makePermalink(file: string, root: string) {
    let lastPath = basename(file).match(/^index/)
        ? dirname(file)
        : join(dirname(file), basename(file).replace(/\..+$/, ''));
    return join('/', relative(root, lastPath)).replace(/\\/g, '/');
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
                c.find({ 'meta.rootPath': rootPath })
                    .toArray()
                    .then(d => res(d))
                    .catch(e => rej(e));
            })
            .catch(reason => console.error(reason));
    });

    if (data.length < 1) return [];
    else return data[0].meta.files;
}

/**
 * Write a given set of answers to the database.
 */
export async function writeToDb(foil: Post) {
    await database.then(async client => {
        let db = client.db('db');

        var redirectCollection: Collection = db.collection('redirect');

        // ⚡ Index static files in foil directory
        let ignoredTypes = ['tsx', 'ts', 'scss', 'md', 'json', 'lock', 'db'];

        var staticFiles = fileSync(foil.meta.rootPath).filter(
            f =>
                !(
                    ignoredTypes.reduce(
                        (prev, cur) => prev || f.endsWith(cur),
                        false
                    ) || f.match(/node_modules|diary/)
                )
        );

        // Add Static files to database
        for (var sf of staticFiles) {
            var filePermalink = join(
                foil.rootPermalink,
                relative(foil.meta.rootPath, sf)
            ).replace(/\\/g, '/');

            let query = {
                to: sf
            };

            let update = {
                from: filePermalink,
                to: sf,
                dateModified: statSync(sf).mtime
            };

            let options = {
                upsert: true
            };

            await redirectCollection
                .updateOne(query, { $set: update }, options)
                .then(r => {})
                .catch(e => console.log(e));
        }
        if (staticFiles.length > 0) {
            console.log(
                gray(
                    `📒 Indexed ${staticFiles.length} static file${
                        staticFiles.length == 1 ? '' : 's'
                    }.`
                )
            );
        }

        // 💖 Add foil module to database
        var portfolioCollection: Collection = db.collection('portfolio');
        await portfolioCollection
            .updateOne(
                { permalink: foil.permalink },
                { $set: foil },
                { upsert: true }
            )
            .then(r =>
                console.log(`Added ${cyan(foil.title)} to the Database.`)
            )
            .catch(e => console.log(e));
    });
}

export async function importJson(jsonPath: string) {
    return JSON.parse(
        await (
            await readFile(new URL('file://' + jsonPath, import.meta.url))
        ).toString()
    );
}
