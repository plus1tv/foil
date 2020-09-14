import * as fs from 'fs';
import { Collection } from 'mongodb';
import { database } from '../db';
import { config } from '../config';
/**
 * Run through every indexed file and portfolio item to see if it still exists. 
 */
export async function redirects() {
    console.log('🏹 Foil Database Redirects\n');
    await database.then(async (client) => {
        // Add redirects
        let db = client.db('db');
        var redirectCollection: Collection = db.collection('redirect');
        var redirects = config.redirects;
        for (var rd of redirects) {
            if (rd.to && rd.from) {
                let query = {
                    to: rd.to
                };

                let options = {
                    upsert: true
                };

                await redirectCollection
                    .updateOne(query, { $set: { to: rd.to, from: rd.from } }, options)
                    .then((r) => console.log(`Redirecting ${rd.from} to ${rd.to}.`))
                    .catch((e) => console.log(e));
            }
        }

        console.log('✨ Cleaned portfolio collection.');
    });
}
