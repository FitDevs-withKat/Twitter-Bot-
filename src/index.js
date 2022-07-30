const twit = require('twit');
require('dotenv').config();

const T = new twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

async function search(query) {
    try {
        return T.get('search/tweets', {q: query, count: 1});
    } catch (error) {
        console.log("Failed to search tweets ", error)
        throw error;
    }
}

async function retweet(query) {
    const data = await search(query);

    const tweet = data.statuses;
    const tweetId = tweet[0].id_str;
    try {
        await T.post('statuses/retweet/:id', {id: tweetId});
    } catch (error) {
        console.log("Failed to retweet ", error)
    }
}

setInterval(() => retweet('#fitdevs'), 10000);
