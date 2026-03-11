const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

async function getCollection(collectionName) {
    await client.connect();
    const dbName = 'HomeServiceDB';
    const db = await client.db(dbName);
    const collection = await db.collection(collectionName);
    return collection;
}

module.exports = {
    getCollection
};