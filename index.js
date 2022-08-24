const {retweet, search, getLatestRetweet, replyToTweet} = require("./src/service/twitterService");
const {
    upsertTimeEntry,
    getNumbersFromTweet,
    getLastEnteredTweetId,
    upsertLatestEnteredTweetId, getTotalCampaignMinutes
} = require("./src/service/campaignService");
const {mongodb} = require("./src/service/mongodbService");


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
    console.log("Starting bot");

    const response = await getLatestRetweet({
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
        await retweet(tweet.id);
    });
    res.send("Bot Started");

    console.log("Done")
}

async function runCampaign(req, res) {
    console.log("Starting campaign updates...");

    await mongodb.connect();

    const tweets = [];
    const lastEntered = await getLastEnteredTweetId();

    //Most recent will be first in the array
    const data = await search('#OneMillionMinutes -is:retweet', undefined, {
        expansions: 'author_id,',
        'user.fields': 'username'
    });
    for await (const result of data) {
        const numbersFromTweet = getNumbersFromTweet(result);
        if (numbersFromTweet) {
            tweets.push(numbersFromTweet);
        } else {
            try {
                //TODO: This will 403 if the tweet is not unique. I'd like to add the author's username in the response so that it's not static
                await replyToTweet(result.id, `Your tweet was skipped because the bot couldn't parse your entry. @dev_nerd_2 will investigate and follow up.`);
            } catch (e) {
                console.error('reply failed', e);
            }
        }
    }
    if (tweets.length === 0) {
        await mongodb.disconnect();
        console.log("Done");
        res.send("Bot started");
        return;
    }
    //15 mins / 200 requests = 1 request every 4.5 seconds
    //+ 1 to avoid hitting rate limit
    await iterateOverInterval(5500, tweets, async function (tweet) {
        try {
            console.log(tweet.id)
            const {total} = await upsertTimeEntry(tweet.twitterUserId, tweet.number);
            const communityTotal = await getTotalCampaignMinutes();
            await replyToTweet(tweet.id, `Your entry has been logged. You have logged ${total} total minutes! The community has logged ${communityTotal} minutes toward our goal of one million.`);
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
