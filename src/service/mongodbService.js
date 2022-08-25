const {MongoClient} = require('mongodb');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const uri = process.env.DB_URI;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
const dbName = 'fitdevs';

function upsert(query, updateQuery, collection, options) {
    return client.db(dbName).collection(collection).findOneAndUpdate(query, updateQuery, {upsert: true, ...options});
}

//https://www.mongodb.com/docs/drivers/node/current/fundamentals/aggregation/
async function getAggregateTotal(query, collection) {
    const aggCursor = client.db(dbName).collection(collection).aggregate([
        {$group: {_id: null, total: {$sum: "$total"}}}
    ]);
    const {total} = await aggCursor.next();
    return total;
}

async function findOne(query, options, collection) {
    return client.db(dbName).collection(collection).findOne();
}

async function connect() {
    try {
        await client.connect();
        console.log("Successfully connected to DB");
    } catch (error) {
        console.log("Problem connecting to mongo db", error);
        throw error;
    }
}

async function disconnect() {
    try {
        await client.close();
        console.log("Successfully closed connection to DB")
    } catch (error) {
        console.log("Problem disconnecting to mongo db", error);
    }
}


module.exports = {
    mongodb: {
        connect,
        upsert,
        findOne,
        disconnect,
        getAggregateTotal
    }
}
