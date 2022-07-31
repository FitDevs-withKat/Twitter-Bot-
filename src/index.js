const {TwitterApi} = require('twitter-api-v2');
require('dotenv').config();

const twitter = new TwitterApi({
    appKey: process.env.CONSUMER_KEY,
    appSecret: process.env.CONSUMER_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_TOKEN_SECRET
});

function search(query, lastTweetId) {
    try {
        //rate limit is 180 requests every 15 minutes
        return twitter.v2.search(query, {max_results: 10, since_id: lastTweetId});
    } catch (error) {
        console.log("Failed to search tweets ", error)
        throw error;
    }
}

function retweet(tweetId) {
    try {
        //rate limit is 75 requests every 15 minutes
        return twitter.v2.retweet(process.env.BOT_USER_ID, tweetId);
    } catch (error) {
        console.log("Failed to retweet ", error)
    }
}

function getLatestRetweet() {
    try {
        return twitter.v2.userTimeline(process.env.BOT_USER_ID, {
            exclude: "replies",
            "tweet.fields": "referenced_tweets",
            expansions: "referenced_tweets.id"
        })
    } catch (error) {
        console.log("Failed to retweet ", error)
    }
}

function iterateAndRetweetResults(data) {
    if (data.done) {
        console.log("done")
        return;
    }
    let index = 0;
    const intervalId = setInterval(() => {
        if (index === data.meta.result_count - 1) {
            clearInterval(intervalId);
            data.next().then(result => iterateAndRetweetResults(result));
        }
        retweet(data.tweets[index].id)
        console.log("retweeting", data.tweets[index].id);
        index++;
    }, 13000);

}

async function startBot() {
    const response = await getLatestRetweet();
    const latestId = response.tweets?.[0]?.referenced_tweets[0]?.id;

    const data = await search("#fitdevs", latestId);
    iterateAndRetweetResults(data);

}

startBot();
