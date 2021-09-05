import { MongoClient, Db } from 'mongodb';

const url = 'mongodb://localhost:27017';

console.log('🍃 Opening MongoDB Connection.');

const database: Promise<MongoClient> = MongoClient.connect(url).catch((reason) =>
    console.error(reason)
) as Promise<MongoClient>;

function closeConnection() {
    database.then(async (client) => {
        console.log('🍃 Closing MongoDB Connection.');
        client.close();
        process.exit();
    });
}

process.on('SIGTERM', closeConnection).on('SIGINT', closeConnection);

export { database };
