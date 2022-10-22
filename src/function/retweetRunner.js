import {getLatestRetweet, retweet, search} from "../service/twitterService.js";
import {iterateOverInterval} from "../util/iterateOverInterval.js";

export async function startBot(req, res) {
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
    const data = await search("#FitDevs -is:retweet", latestId);

    for await (const result of data) {
        sortedTweets.push(result);
    }

    //To ensure that the tweet we last RT'd is always the most recent
    sortedTweets.reverse();

    //15 mins / 50 requests = 1 request every 18 seconds
    //+ 1 to avoid hitting rate limit
    await iterateOverInterval(19000, sortedTweets, async function (tweet) {
        console.info('Retweeting tweet ID', tweet?.id);
        await retweet(tweet.id);
    });
    res.send("Bot Done");

    console.log("Done")
}

