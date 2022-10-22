const {TwitterApi} = require("twitter-api-v2");

const twitter = new TwitterApi({
    appKey: process.env.CONSUMER_KEY,
    appSecret: process.env.CONSUMER_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_TOKEN_SECRET
});

async function search(query, lastTweetId, options = undefined, attempts = 0) {
    try {
        //rate limit is 180 requests every 15 minutes
        return await twitter.v2.search(query, {max_results: 100, since_id: lastTweetId, ...options});
    } catch (err) {
        console.error("Search failed:", err);
        return retry((attemptCount) => search(query, lastTweetId, options, attemptCount + 1), 3000, attempts, err)
    }
}

function retry(callback, delay, attempts, err) {
    console.error("Search for user failed:", err);
    if (attempts >= 3) {
        console.error(err);
        process.exit(1);
    }
    return new Promise((resolve) => {
        setTimeout(async () => {
            console.debug("Call failed, attempt #", attempts);
            await callback(attempts).then((r) => resolve(r)).finally(() => resolve());
        }, delay);
    });
}
async function findUserById(userId, fields = undefined, attempts = 0) {
    try {
        //rate limit is 900 requests every 15 minutes
        return await twitter.v2.user(userId, fields);
    } catch (err) {
        console.error("Search for user failed:", err);
        return retry((attemptCount) => findUserById(userId, fields, attemptCount + 1), 3000, attempts, err)
    }
}

async function retweet(tweetId, attempts = 0) {
    try {
        //rate limit is 50 requests every 15 minutes
        return await twitter.v2.retweet(process.env.BOT_USER_ID, tweetId);
    } catch (err) {
        console.error("Retweet failed:", err);
        return retry((attemptCount) => retweet(tweetId, attemptCount + 1), 3000, attempts, err)
    }
}

async function getLatestRetweet(options, attempts = 0) {
    try {
        return await twitter.v2.userTimeline(process.env.BOT_USER_ID, options);
    } catch (err) {
        console.error("Fetching last retweet failed:", err);
        return retry((attemptCount) => getLatestRetweet(options, attemptCount + 1), 3000, attempts, err)
    }
}

async function replyToTweet(tweetId, text, attempts = 0) {
    try {
        return await twitter.v2.reply(text, tweetId);
    } catch (err) {
        console.error("Reply failed:", err);
        return retry((attemptCount) => replyToTweet(tweetId, text, attemptCount + 1), 3000, attempts, err)
    }
}

module.exports = {
    search,
    retweet,
    getLatestRetweet,
    replyToTweet,
    findUserById
}

