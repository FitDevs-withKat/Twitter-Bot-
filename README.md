# Twitter-Bot

## Rate Limits
The Twitter Bot is limited to pulling 500,000 tweets per month, it is important that we do not reach this limit. Certain endpoints (like filtered stream and recent search) have a limit on how many Tweets they can pull per month. This information can be found via the Twitter Docs. Current usage can be viewed via the Twitter Developer Dashboard for the bot account.

## Running Locally
Clone this repository and create a file named `.env` in the root of the project. Add and populate the below in this file.

```
CONSUMER_KEY=
CONSUMER_SECRET=
ACCESS_TOKEN=
ACCESS_TOKEN_SECRET=
```

This bot can then be run locally by running ```node app.js```

## Deploying
