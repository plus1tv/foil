import { stat } from 'fs';
import { cyan } from 'chalk';
import { Collection } from 'mongodb';
import { database } from '../db';
import { basename } from 'path';
import { Post } from '../types';
/**
 * Run through every indexed file and portfolio item to see if it still exists.
 */
export async function clean(_foils: Post[]) {
    console.log('🌊 Foil Database Cleaner: \n');
    await database.then(async client => {
        let db = client.db('db');
        var redirectCol = db.collection('redirect');
        var portfolioCol = db.collection('portfolio');

        var cleanFiles = (col: Collection) =>
            col
                .find({})
                .toArray()
                .catch(err => console.error(err))
                .then(res => {
                    if (res)
                        for (var f of res) {
                            let { _id, permalink = null } = f;
                            let files = f.to ? [{ path: f.to }] : f.files;
                            for (let file of files) {
                                //Should we delete this entry?
                                let deleteThis = () => {
                                    col.deleteOne({ _id })
                                        .catch(err => console.error(err))
                                        .then(() =>
                                            console.log('Removed ' + file.path)
                                        );
                                };

                                if (/\.([A-z])*$/.test(file.path))
                                    stat(file.path, stats => {
                                        if (stats?.code === 'ENOENT') {
                                            deleteThis();
                                        }

                                        if (
                                            stats &&
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
                                    });
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
