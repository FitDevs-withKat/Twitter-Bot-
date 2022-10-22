import {MongoClient} from "mongodb";
import dotenv from 'dotenv';

dotenv.config();
const uri = process.env.DB_URI;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
const dbName = 'fitdevs';

async function upsert(query, updateQuery, collection) {
    try {
        return await client.db(dbName).collection(collection).findOneAndUpdate(query, updateQuery, {
            upsert: true,
            returnDocument: "after"
        });
    } catch (e) {
        console.error("Failed to upsert", updateQuery, e)
    }
}

//https://www.mongodb.com/docs/drivers/node/current/fundamentals/aggregation/
async function getAggregateTotal(collection) {
    const aggCursor = client.db(dbName).collection(collection).aggregate([
        {$group: {_id: null, total: {$sum: "$total"}}}
    ]);
    const {total} = await aggCursor.next();
    return total;
}

async function findOne(query, options, collection) {
    try {
        return await client.db(dbName).collection(collection).findOne();
    } catch (err) {
        console.error("Failed to run query: findOne", err)
    }
}

async function deleteByQuery(query, collection) {
    try {
        return await client.db(dbName).collection(collection).deleteMany(query);
    } catch (error) {
        console.log("Failed to run deleteByQuery with the following query", query, error);
    }
}


async function connect() {
    try {
        return await client.connect();
    } catch (error) {
        console.log("Problem connecting to mongo db", error);
    }
}

async function disconnect() {
    try {
        return await client.close();
    } catch (error) {
        console.log("Problem disconnecting to mongo db", error);
    }
}


export {
    connect,
    upsert,
    findOne,
    disconnect,
    getAggregateTotal,
    deleteByQuery
};
