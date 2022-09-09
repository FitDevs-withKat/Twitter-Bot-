const {TwitterApi} = require("twitter-api-v2");

const twitter = new TwitterApi({
    appKey: process.env.CONSUMER_KEY,
    appSecret: process.env.CONSUMER_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_TOKEN_SECRET
});

async function search(query, lastTweetId, options = undefined) {
    try {
        //rate limit is 180 requests every 15 minutes
        return await twitter.v2.search(query, {max_results: 100, since_id: lastTweetId, ...options});
    } catch (err) {
        console.error("Search failed:", err);
    }
}

async function retweet(tweetId) {
    try {
        //rate limit is 50 requests every 15 minutes
        return await twitter.v2.retweet(process.env.BOT_USER_ID, tweetId);
    } catch (err) {
        console.error("Retweet failed:", err);
    }
}

async function getLatestRetweet(options) {
    try {
        return await twitter.v2.userTimeline(process.env.BOT_USER_ID, options);
    } catch (err) {
        console.error("Fetching last retweet failed:", err);
    }
}

async function replyToTweet(tweetId, text) {
    try {
        return await twitter.v2.reply(text, tweetId);
    } catch (err) {
        console.error("Reply failed:", err);
    }
}

module.exports = {
    search,
    retweet,
    getLatestRetweet,
    replyToTweet
}

