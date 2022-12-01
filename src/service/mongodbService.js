const {MongoClient} = require('mongodb');

const uri = process.env.DB_URI;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
const dbName = 'fitdevs';

async function upsert(query, updateQuery, collection) {
    try {
        return await client.db(dbName).collection(collection).findOneAndUpdate(query, updateQuery, {
            upsert: true,
            returnDocument: "after"
        });
    } catch (err) {
        console.error("Failed to upsert", updateQuery, err);
        throw err;
    }
}

//https://www.mongodb.com/docs/drivers/node/current/fundamentals/aggregation/
async function getAggregateTotal(collection) {
    try {
        const aggCursor = client.db(dbName).collection(collection).aggregate([
            {$group: {_id: null, total: {$sum: "$total"}}}
        ]);
        const {total} = await aggCursor.next();
        return total;
    } catch(err) {
        console.error("Failed to get aggregate total", err);
        throw err;
    }
}

async function findOne(query, options, collection) {
    try {
        return await client.db(dbName).collection(collection).findOne();
    } catch (err) {
        console.error("Failed to run query: findOne", query);
        throw err;
    }
}

async function deleteByQuery(query, collection) {
    try {
        return await client.db(dbName).collection(collection).deleteMany(query);
    } catch (error) {
        console.error("Failed to run deleteByQuery with the following query", query);
        throw error;
    }
}


async function connect() {
    try {
        return await client.connect();
    } catch (error) {
        console.error("Unable to connect to mongo db", error);
        process.exit(1);
    }
}

async function disconnect() {
    try {
        return await client.close();
    } catch (error) {
        console.error("Problem disconnecting to mongo db", error);
    }
}


module.exports = {
    mongodb: {
        connect,
        upsert,
        findOne,
        disconnect,
        getAggregateTotal,
        deleteByQuery
    }
}
