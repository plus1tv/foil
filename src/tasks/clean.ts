import * as fs from 'fs';
import { Collection } from 'mongodb';
import { database } from '../../../backend/src/db';

/**
 * Run through every indexed file and portfolio item to see if it still exists. 
 */
export async function clean() {
  console.log('🌊 Foilfolio Database Cleaner\n');
  await database.then(async client => {
    let db = client.db('db');
    var redirectCol = db.collection('redirect');
    var portfolioCol = db.collection('portfolio');

    var cleanFiles = (col: Collection) =>
      col.find({})
        .toArray()
        .catch(err => console.error(err))
        .then(res => {
          if (res)
            for (var f of res) {
              let { _id } = f;
              let file = f.file || f.to;
              if (/\.([A-z])*$/.test(file))
                fs.exists(file, exists => {
                  if (!exists) {
                    col.deleteOne({ _id })
                      .catch(err => console.error(err))
                      .then(() => console.log('Removed ' + file));
                  }
                });
            }
        });

    await cleanFiles(redirectCol);
    console.log('✨ Cleaned files collection.')
    await cleanFiles(portfolioCol);
    console.log('✨ Cleaned portfolio collection.')

  });
}
