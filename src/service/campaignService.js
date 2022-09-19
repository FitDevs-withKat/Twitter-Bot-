const {mongodb} = require("./mongodbService");

async function upsertTimeEntry(authorId, amount, username, collection = undefined) {
    const result = await mongodb.upsert({author_id: authorId}, {
        $inc: {total: parseInt(amount)},
        $set: {username: username}
    }, collection || "campaign_data");
    return result.value;
}

async function upsertTimeEntryWeekly(authorId, amount, username) {
    const result = await upsertTimeEntry(authorId, amount, username, "campaign_data_weekly")
    return result;
}

async function getLastEnteredTweetId() {
    const result = await mongodb.findOne(undefined, undefined, "campaign_tweet_tracker");
    if (!result) {
        return undefined;
    }
    return {tweetId: result.latest_tweet_id};
}

function getTotalCampaignMinutes() {
    return mongodb.getAggregateTotal("campaign_data");
}

async function upsertLatestEnteredTweetId(tweetId) {
    return mongodb.upsert({}, {$set: {latest_tweet_id: tweetId}}, "campaign_tweet_tracker");
}

async function clearWeeklyData() {
    return mongodb.deleteByQuery({}, "campaign_data_weekly");
}

function getNumbersFromTweet(tweet) {
    //Grab the number before the word " min", so they can min, mins, minutes, etc.
    //'gi' is a flag that indicates case-insensitivity
    const regex = /\d+[ ]?(?=min)/gi;
    const result = tweet.text.match(regex);
    if (!result) {
        return undefined;
    }
    const number = result[0];
    return {
        id: tweet.id,
        number,
        twitterUserId: tweet.author_id
    }
}

module.exports = {
    upsertTimeEntry,
    getNumbersFromTweet,
    upsertLatestEnteredTweetId,
    getLastEnteredTweetId,
    upsertTimeEntryWeekly,
    getTotalCampaignMinutes,
    clearWeeklyData
}
