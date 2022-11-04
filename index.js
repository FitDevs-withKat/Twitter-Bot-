require('dotenv').config();
const {retweet, search, getLatestRetweet, replyToTweet, findUserById} = require("./src/service/twitterService");
const {
    upsertTimeEntry,
    getNumbersFromTweet,
    getLastEnteredTweetId,
    upsertLatestEnteredTweetId, getTotalCampaignMinutes, upsertTimeEntryWeekly, clearWeeklyData
} = require("./src/service/campaignService");
const {mongodb} = require("./src/service/mongodbService");

async function iterateOverInterval(interval, data, callback) {
    return new Promise((resolve, reject) => {
        let index = 0;
        const intervalId = setInterval(async () => {
            if (data.length < 1 || index === data.length - 1) {
                clearInterval(intervalId);
                resolve();
            }
            if (!data[index]) {
                resolve();
                //prevent continuation with empty data
                return;
            }
            try {
                await callback(data[index])
            } catch (error) {
                reject(error);
            }
            index++;

        }, interval);
    });
}

async function startBot(req, res) {
    console.log("Starting bot");

    const response = await getLatestRetweet({
        exclude: "replies",
        "tweet.fields": "referenced_tweets",
        expansions: "referenced_tweets.id"
    });

    if (!response) {
        res.send("Failed to get latest retweet, not starting bot");
        console.error("Failed to start bot. Couldn't fetch latest retweet");
        return;
    }

    const latestId = response.tweets?.[0]?.referenced_tweets[0]?.id;
    const sortedTweets = [];
    let data;
    try {
        data = await search("#FitDevs -is:retweet", latestId);
    } catch (err) {
        console.error("Failed to fetch fitdevs tweets", err);
        process.exit(1);
    }
    for await (const result of data) {
        sortedTweets.push(result);
    }

    //To ensure that the tweet we last RT'd is always the most recent
    sortedTweets.reverse();

    //15 mins / 50 requests = 1 request every 18 seconds
    //+ 1 to avoid hitting rate limit
    try {
        await iterateOverInterval(19000, sortedTweets, async function (tweet) {
            console.info('Retweeting tweet ID', tweet?.id);
            await retweet(tweet.id);
        });
    } catch (e) {
        console.error("Failure occurred during retweeting, exiting early.");
        process.exit(1);
    }
    res.send("Bot Done");
    console.log("Done")
}

async function runCampaign(req, res) {
    console.log("Starting campaign updates...");

    await mongodb.connect();

    const tweets = [];
    const lastEntered = await getLastEnteredTweetId();

    //Most recent will be first in the array
    const data = await search('#OneMillionMinutes -is:retweet', lastEntered?.tweetId, {
        expansions: 'author_id'
    });
    for await (const result of data) {
        const numbersFromTweet = getNumbersFromTweet(result);
        if (numbersFromTweet) {
            tweets.push(numbersFromTweet);
        } else {
            try {
                const response = await findUserById(result.author_id, {'user.fields': ['name']});
                const username = response.data.username;
                await replyToTweet(result.id, `@${username}, Your tweet was skipped because the bot couldn't parse your entry. @dev_nerd_2 will investigate and follow up.`);
            } catch (err) {
                console.error("Failure to notify user of skipped tweet", result.author_id, err)
            }
        }
    }
    if (tweets.length === 0) {
        await mongodb.disconnect();
        console.log("Done");
        res.send("Bot Started but terminated early because there are no new tweets.");
        return;
    }
    //15 mins / 200 requests = 1 request every 4.5 seconds
    //+ 1 to avoid hitting rate limit
    let lastSuccessfulId;
    try {
        await iterateOverInterval(5500, tweets, async function (tweet) {
            const response = await findUserById(tweet.twitterUserId, {'user.fields': ['name']});
            const username = response.data.username;
            //TODO: upsertTimeEntry was failing, claiming the  Client must be connected before running operations.
            // Need to have someone investigate what's going on
            await mongodb.connect();

            const [cumulativeResponse, weeklyResponse] = await Promise.all([
                upsertTimeEntry(tweet.twitterUserId, tweet.number, username),
                upsertTimeEntryWeekly(tweet.twitterUserId, tweet.number, username)
            ]);
            const communityTotal = await getTotalCampaignMinutes();
            await replyToTweet(tweet.id, `Your entry has been logged. You have logged ${cumulativeResponse.total} total minutes! The community has logged ${communityTotal} minutes toward our goal of one million.`);
            lastSuccessfulId = tweet.id;
        });
    } catch (e) {
        console.error("Failure while iterating through OneMillionMinutes tweets", e);
    }

    //Update entry with the most recently successfully logged tweet, so we know where to start our search next time
    try {
        await upsertLatestEnteredTweetId(lastSuccessfulId);
    } catch (err) {
        console.error("Failed to update  latest entered tweet id", lastSuccessfulId, err);
        process.exit(1);
    }
    await mongodb.disconnect();
    res.send("Bot started");
    console.log("Done");
}

async function runWeeklyDataCleaner(req, res) {
    console.log("Clearing weekly data...");

    await mongodb.connect();

    try {
        await clearWeeklyData();
    } catch (err) {
        console.error("Unable to clear weekly data");
        process.exit(1);
    }
    await mongodb.disconnect();
    res.send("Done");
}

module.exports = {
    startBot,
    runCampaign,
    runWeeklyDataCleaner
}
