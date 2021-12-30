import { promises } from 'fs';
const { access } = promises;
import * as chalk from 'chalk';
const { cyan } = chalk;
import { Collection } from 'mongodb';
import { database } from '../db';
import { basename } from 'path';
import { Post } from '../types';

async function exists(path) {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * Run through every indexed file and portfolio item to see if it still exists.
 */
export async function clean(_foils: Post[]) {
    console.log('🌊 Foil Database Cleaner:');
    await database.then(async client => {
        let db = client.db('db');
        var redirectCol = db.collection('redirect');
        var portfolioCol = db.collection('portfolio');

        var cleanFiles = (col: Collection) =>
            col
                .find({})
                .toArray()
                .catch(err => console.error(err))
                .then(async res => {
                    if (res)
                        for (var f of res) {
                            let { _id, permalink = null } = f;
                            let files = f.to ? [{ path: f.to }] : f.meta.files;
                            for (let file of files) {
                                //Should we delete this entry?
                                let deleteThis = () => {
                                    col.deleteOne({ _id })
                                        .catch(err => console.error(err))
                                        .then(() =>
                                            console.log(
                                                '❌ Removed ' + file.path
                                            )
                                        );
                                };

                                if (/\.([A-z])*$/.test(file.path)) {
                                    if (await exists(file.path)) {
                                        if (
                                            basename(file.path) ==
                                            'package.json'
                                        ) {
                                            if (permalink) {
                                                //check if package.json has same permalink as this, if not delete this.
                                                let pack = require(file.path);
                                                if (
                                                    pack.foil &&
                                                    '/' +
                                                        pack.foil.permalink !==
                                                        permalink
                                                ) {
                                                    console.log(
                                                        'Permalink ' +
                                                            permalink +
                                                            ' does not match ' +
                                                            pack.foil
                                                                .permalink +
                                                            ', deleting.'
                                                    );
                                                    deleteThis();
                                                }
                                            }
                                        }
                                    } else {
                                        deleteThis();
                                    }
                                }
                            }
                            //there can only be one database entry per file set
                        }
                });

        //delete stale database entries (permalink redirecting)

        await cleanFiles(redirectCol);
        console.log(`🧼 Cleaned ${cyan("'files'")} collection.`);
        await cleanFiles(portfolioCol);
        console.log(`🧼 Cleaned ${cyan("'portfolio'")} collection.`);
    });
}

export async function reset() {
    console.log('🌊 Foil Database Cleaner:');
    await database.then(async client => {
        let db = client.db('db');
        var redirectCol = db.collection('redirect');
        var portfolioCol = db.collection('portfolio');

        var cleanFiles = (col: Collection) =>
            col
                .find({})
                .toArray()
                .catch(err => console.error(err))
                .then(async res => {
                    if (res)
                        for (var f of res) {
                            let { _id } = f;
                            let files = f.to ? [{ path: f.to }] : f.meta.files;
                            for (let file of files) {
                                //Should we delete this entry?
                                let deleteThis = () => {
                                    col.deleteOne({ _id })
                                        .catch(err => console.error(err))
                                        .then(() =>
                                            console.log(
                                                '❌ Removed ' + file.path
                                            )
                                        );
                                };
                                deleteThis();
                            }
                        }
                });

        await cleanFiles(redirectCol);
        console.log(`🧼 Reset ${cyan("'files'")} collection.`);
        await cleanFiles(portfolioCol);
        console.log(`🧼 Reset ${cyan("'portfolio'")} collection.`);
    });
}
