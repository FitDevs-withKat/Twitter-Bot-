# Twitter-Bot

## Rate Limits
The Twitter Bot is limited to pulling 2 million tweets per month, it is important that we do not reach this limit. Certain endpoints (like filtered stream and recent search) have a limit on how many Tweets they can pull per month. This information can be found via the Twitter Docs. Current usage can be viewed via the Twitter Developer Dashboard for the bot account.

## Running Locally
Clone this repository and create a file named `.env` in the root of the project. Add and populate the below in this file.

```
CONSUMER_KEY=
CONSUMER_SECRET=
ACCESS_TOKEN=
ACCESS_TOKEN_SECRET=
```

This bot can then be run locally by running ```node index.js```

## Deploying

## Feature Compliance
All functionality new or old must comply with [Twitter's rules](https://help.twitter.com/en/rules-and-policies/twitter-automation), [developer agreement](https://developer.twitter.com/en/developer-terms/agreement-and-policy), and [automation rules](https://help.twitter.com/en/rules-and-policies/twitter-rules). Failure to do so will cause suspension or termination of our project from Twitter.
