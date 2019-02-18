import * as fs from 'fs';
import { Collection } from 'mongodb';
import { database } from '../db';

/**
 * Run through every indexed file and portfolio item to see if it still exists. 
 */
export async function clean() {
    console.log('🌊 Foil Database Cleaner\n');
    await database.then(async (client) => {
        let db = client.db('db');
        var redirectCol = db.collection('redirect');
        var portfolioCol = db.collection('portfolio');

        var cleanFiles = (col: Collection) =>
            col.find({}).toArray().catch((err) => console.error(err)).then((res) => {
                if (res)
                    for (var f of res) {
                        let { _id } = f;
                        let files = f.to ? [ { path: f.to } ] : f.files;
                        for (let file of files) {
                            if (/\.([A-z])*$/.test(file.path))
                                fs.exists(file.path, (exists) => {
                                    if (!exists) {
                                        col
                                            .deleteOne({ _id })
                                            .catch((err) => console.error(err))
                                            .then(() => console.log('Removed ' + file.path));
                                    }
                                });
                        }
                    }
            });

        await cleanFiles(redirectCol);
        console.log('✨ Cleaned files collection.');
        await cleanFiles(portfolioCol);
        console.log('✨ Cleaned portfolio collection.');
    });
}
