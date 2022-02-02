import { MongoClient } from 'mongodb';
import { config as foilConfig } from './config';

console.log(
    '🍃 Opening MongoDB Connection. ' + ('\x1b[2m(' + foilConfig.mongoUrl + ')\x1b[0m')
);
const config = {
    appName: 'Foil Backend'
};
const database: Promise<MongoClient> = MongoClient.connect(
    foilConfig.mongoUrl,
    config
).catch(reason => console.error(reason)) as Promise<MongoClient>;

function closeConnection() {
    database.then(async client => {
        console.log('🍃 Closing MongoDB Connection.');
        client.close();
        process.exit();
    });
}

process.on('SIGTERM', closeConnection).on('SIGINT', closeConnection);

export { database };
