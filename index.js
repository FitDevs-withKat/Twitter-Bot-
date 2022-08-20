const {TwitterApi} = require('twitter-api-v2');
const {retweet, search, getLatestRetweet, replyToTweet} = require("./src/service/twitterService");
const {
    upsertTimeEntry,
    getNumbersFromTweet,
    getLastEnteredTweetId,
    upsertLatestEnteredTweetId, getTotalCampaignMinutes
} = require("./src/service/campaignService");
const {mongodb} = require("./src/service/mongodbService");
require('dotenv').config();

const twitter = new TwitterApi({
    appKey: process.env.CONSUMER_KEY,
    appSecret: process.env.CONSUMER_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_TOKEN_SECRET
});


async function iterateOverInterval(interval, data, callback) {
    return new Promise((resolve) => {
        let index = 0;
        const intervalId = setInterval(async () => {
            if (data.length < 1 || index === data.length - 1) {
                clearInterval(intervalId);
                resolve();
            }
            if (!data[index]) {
                //prevent continuation with empty data
                return;
            }

            await callback(data[index])
            index++;

            //15 mins / 50 requests = 1 request every 18 seconds
            //+ 1 to avoid hitting rate limit
        }, interval);
    });
}

async function startBot(req, res) {
    //Respond immediately so that Cron-job doesn't time out (max 30s timeout))
    res.send("Bot Started")
    console.log("Starting bot");

    const response = await getLatestRetweet(twitter, {
        exclude: "replies",
        "tweet.fields": "referenced_tweets",
        expansions: "referenced_tweets.id"
    });
    const latestId = response.tweets?.[0]?.referenced_tweets[0]?.id;
    const sortedTweets = [];
    const data = await search("#FitDevs -is:retweet", latestId);

    for await (const result of data) {
        sortedTweets.push(result);
    }

    //To ensure that the tweet we last RT'd is always the most recent
    sortedTweets.reverse();

    //15 mins / 50 requests = 1 request every 18 seconds
    //+ 1 to avoid hitting rate limit
    await iterateOverInterval(19000, sortedTweets, async function (tweet) {
        console.log('Retweeting tweet ID', tweet?.id);
        await retweet(twitter, tweet.id);
    });

    console.log("Done")
}

async function runCampaign(req, res) {
    console.log("Starting campaign updates...");

    await mongodb.connect();

    const tweets = [];
    const lastEntered = await getLastEnteredTweetId();
    //Most recent will be first in the array
    const data = await search(twitter, '#OneMillionMinutes -is:retweet', lastEntered?.tweetId, {expansions: 'author_id'});

    for await (const result of data) {
        const numbersFromTweet = getNumbersFromTweet(result);
        if (numbersFromTweet) {
            tweets.push(numbersFromTweet);
        } else {
            //TODO: Tweet is not in correct format, number is missing
        }
    }
    if (tweets.length === 0) {
        await mongodb.disconnect();
        return;
    }
    //15 mins / 200 requests = 1 request every 4.5 seconds
    //+ 1 to avoid hitting rate limit
    await iterateOverInterval(5500, tweets, async function (tweet) {
        try {
            console.log(tweet.id)
            const {total} = await upsertTimeEntry(tweet.twitterUserId, tweet.number);
            const communityTotal = await getTotalCampaignMinutes();
            await replyToTweet(twitter, tweet.id, `Your entry has been logged. You have logged ${total} total minutes! The community has logged ${communityTotal} minutes toward our goal of one million.`);
        } catch (err) {
            console.error("Something went wrong while logging data", err)
        }
    });

    //Update entry with the most recent tweetId so we know where to start our search next time
    try {
        await upsertLatestEnteredTweetId(tweets[0].id);
    } catch (err) {
        console.error("Something went wrong while updating the last entered tweet", err);
    }
    await mongodb.disconnect();
    res.send("Bot started");
    console.log("Done");
}

module.exports = {
    startBot,
    runCampaign
}
