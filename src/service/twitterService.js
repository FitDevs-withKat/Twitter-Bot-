const {TwitterApi} = require("twitter-api-v2");
require('dotenv').config();

const twitter = new TwitterApi({
    appKey: process.env.CONSUMER_KEY,
    appSecret: process.env.CONSUMER_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_TOKEN_SECRET
});

function search(query, lastTweetId, options = undefined) {
    //rate limit is 180 requests every 15 minutes
    return twitter.v2.search(query, {max_results: 100, since_id: lastTweetId, ...options});
}

function retweet(tweetId) {
    //rate limit is 50 requests every 15 minutes
    return twitter.v2.retweet(process.env.BOT_USER_ID, tweetId);
}

function getLatestRetweet(options) {
    return twitter.v2.userTimeline(process.env.BOT_USER_ID, options);
}

function replyToTweet(tweetId, text) {
    return twitter.v2.reply(text, tweetId);
}

module.exports = {
    search,
    retweet,
    getLatestRetweet,
    replyToTweet
}

