require('dotenv').config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const whichDatabase = process.env.isDev == "yes" ? "takepoint-dev" : "takepoint";
const mongoDB = new MongoClient(process.env.mongoConnectionStr, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const db = mongoDB.db(whichDatabase);

module.exports = db;