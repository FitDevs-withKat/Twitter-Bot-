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
BOT_USER_ID=1549040078823034882
```

You can manually add a line of code to call the function `startBot` in index.js then run `node index.js` in your terminal to start the application. **Please be cautious running this bot locally while the cron-job is active.**
## Cron-Job 
By utilizing a free third-party site called [cron-job](https://cron-job.org/), we can call our cloud function via a REST API endpoint to run at a customized interval (currently configured to run every hour). 


## Google Cloud
Our bot is uploaded onto Google Cloud as a cloud function. The bot will start up whenever it is called by Cron-Job.
A REST endpoint is exposed through an API Gateway that is separate from the cloud function. This gives us the ability for our function to be called by cron-job with an API Key.
The reason this is necessary is because Google Cloud Functions don't natively support long-lived authentication.

## Deploying

## Feature Compliance
All functionality new or old must comply with [Twitter's rules](https://help.twitter.com/en/rules-and-policies/twitter-automation), [developer agreement](https://developer.twitter.com/en/developer-terms/agreement-and-policy), and [automation rules](https://help.twitter.com/en/rules-and-policies/twitter-rules). Failure to do so will cause suspension or termination of our project from Twitter.
