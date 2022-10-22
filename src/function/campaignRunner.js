import {
    getLastEnteredTweetId,
    getNumbersFromTweet, getTotalCampaignMinutes, upsertLatestEnteredTweetId,
    upsertTimeEntry,
    upsertTimeEntryWeekly
} from "../service/campaignService.js";
import {findUserById, replyToTweet, search} from "../service/twitterService.js";
import {connect, disconnect} from "../service/mongodbService.js";

export async function runCampaign(req, res) {
    console.log("Starting campaign updates...");

    await connect();

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
            const response = await findUserById(result.author_id, {'user.fields': ['name']});
            const username = response.data.username;
            await replyToTweet(result.id, `@${username}, Your tweet was skipped because the bot couldn't parse your entry. @dev_nerd_2 will investigate and follow up.`);
        }
    }
    if (tweets.length === 0) {
        await disconnect();
        console.log("Done");
        res.send("Bot Started but terminated early because there are no new tweets.");
        return;
    }
    //15 mins / 200 requests = 1 request every 4.5 seconds
    //+ 1 to avoid hitting rate limit
    await iterateOverInterval(5500, tweets, async function (tweet) {
        const response = await findUserById(tweet.twitterUserId, {'user.fields': ['name']});
        const username = response.data.username;

        //TODO: upsertTimeEntry was failing, claiming the  Client must be connected before running operations.
        // Need to have someone investigate what's going on
        await connect();

        const [cumulativeResponse, weeklyResponse] = await Promise.all([
            upsertTimeEntry(tweet.twitterUserId, tweet.number, username),
            upsertTimeEntryWeekly(tweet.twitterUserId, tweet.number, username)
        ]);
        const communityTotal = await getTotalCampaignMinutes();
        await replyToTweet(tweet.id, `Your entry has been logged. You have logged ${cumulativeResponse.total} total minutes! The community has logged ${communityTotal} minutes toward our goal of one million.`);
    });

    //Update entry with the most recent tweetId so we know where to start our search next time
    await upsertLatestEnteredTweetId(tweets[0].id);
    await disconnect();
    res.send("Bot started");
    console.log("Done");
}
