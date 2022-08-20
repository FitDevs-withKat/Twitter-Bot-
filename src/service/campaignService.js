const {mongodb} = require("./mongodbService");

async function upsertTimeEntry(authorId, amount) {
    const {value} = await mongodb.upsert({author_id: authorId}, {$inc: {total: parseInt(amount)}}, "campaign_data", {returnDocument: "after"});
    return value;
}

async function getLastEnteredTweetId() {
    const result = await mongodb.findOne(undefined, undefined, "campaign_tweet_tracker");
    if (!result) {
        return undefined;
    }
    return {tweetId: result.latest_tweet_id};
}

function getTotalCampaignMinutes() {
    return mongodb.getAggregateTotal({}, "campaign_data", "total");
}

async function upsertLatestEnteredTweetId(tweetId) {
    return mongodb.upsert({}, {$set: {latest_tweet_id: tweetId}}, "campaign_tweet_tracker");
}

function getNumbersFromTweet(tweet) {
    //Grab the number before the word " min", so they can min, mins, minutes, etc.
    const regex = /\d+(?= min)/;
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
    getTotalCampaignMinutes
}
