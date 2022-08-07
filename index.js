const {TwitterApi} = require('twitter-api-v2');
require('dotenv').config();
const functions = require('@google-cloud/functions-framework');

functions.http('twitter-bot', startBot);

const twitter = new TwitterApi({
    appKey: process.env.CONSUMER_KEY,
    appSecret: process.env.CONSUMER_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_TOKEN_SECRET
});

function search(query, lastTweetId) {
    try {
        //rate limit is 180 requests every 15 minutes
        return twitter.v2.search(query, {max_results: 100, since_id: lastTweetId});
    } catch (error) {
        console.log("Failed to search tweets ", error);
        throw error;
    }
}

function retweet(tweetId) {
    try {
        //rate limit is 50 requests every 15 minutes
        return twitter.v2.retweet(process.env.BOT_USER_ID, tweetId);
    } catch (error) {
        console.log("Failed to retweet ", error);
    }
}

function getLatestRetweet() {
    try {
        return twitter.v2.userTimeline(process.env.BOT_USER_ID, {
            exclude: "replies",
            "tweet.fields": "referenced_tweets",
            expansions: "referenced_tweets.id"
        });
    } catch (error) {
        console.log("Failed to retweet ", error);
    }
}

function iterateAndRetweetResults(data) {
    return new Promise((resolve) => {
        let index = 0;
        const intervalId = setInterval(async () => {
            if (index === data.length - 1) {
                clearInterval(intervalId);
                resolve();
            }
            console.log('Retweeting tweet ID', data[index].id);
            await retweet(data[index].id);
            index++;

            //15 mins / 50 requests = 1 request every 18 seconds
            //+ 1 to avoid hitting rate limit
        }, 19000);
    });
}

async function startBot() {
    console.log("Starting bot");
    const response = await getLatestRetweet();
    const latestId = response.tweets?.[0]?.referenced_tweets[0]?.id;
    const sortedArr = [];
    const data = await search("#fitdevs -is:retweet", latestId);
    for await (const result of data) {
        sortedArr.push(result);
    }
    //To ensure that the tweet we last RT'd is always the most recent
    sortedArr.reverse();
    await iterateAndRetweetResults(sortedArr);

    console.log("Done");
}
