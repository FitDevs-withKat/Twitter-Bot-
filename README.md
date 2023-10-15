# Twitter-Bot

## Rate Limits
The Twitter Bot is limited to pulling 2 million tweets per month, it is important that we do not reach this limit. Certain endpoints (like filtered stream and recent search) have a limit on how many Tweets they can pull per month. This information can be found via the Twitter Docs. Current usage can be viewed via the Twitter Developer Dashboard for the bot account.

## Tools used
* MongoDB
* Twitter Api V2
* Google Cloud Functions Framework
  
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

## Deployment
Our bot is uploaded onto Google Cloud as multiple Cloud Functions. Each separate functionality of the bot will have its own Cloud Function. The functions will automatically run when corresponding Cloud Endpoints are called on interval by Cloud Schedulers. 
A REST endpoint is exposed through an API Gateway that is separate from the cloud function. This gives us the ability for our function to be called by cron-job with an API Key. The database is cloud hosted on a free tier of MongoDB Atlas and access keys must be requested from the project owner.

See below for a visual drawing of the cloud architecture.
![image](https://github.com/Kyle-Kerlew/Twitter-Bot-/assets/15034066/bb44fbe2-18c4-47b2-b1c4-df80d113a9d5)


## Feature Compliance
All functionality new or old must comply with [Twitter's rules](https://help.twitter.com/en/rules-and-policies/twitter-automation), [developer agreement](https://developer.twitter.com/en/developer-terms/agreement-and-policy), and [automation rules](https://help.twitter.com/en/rules-and-policies/twitter-rules). Failure to do so will cause suspension or termination of our project from Twitter.
