
function search(twitter, query, lastTweetId, options = undefined) {
    //rate limit is 180 requests every 15 minutes
    return twitter.v2.search(query, {max_results: 100, since_id: lastTweetId, ...options});
}

function retweet(twitter, tweetId) {
    //rate limit is 50 requests every 15 minutes
    return twitter.v2.retweet(process.env.BOT_USER_ID, tweetId);
}

function getLatestRetweet(twitter, options) {
    return twitter.v2.userTimeline(process.env.BOT_USER_ID, options);
}
function replyToTweet(twitter, tweetId, text) {
    return twitter.v2.reply(text, tweetId);
}

module.exports = {
    search,
    retweet,
    getLatestRetweet,
    replyToTweet
}
