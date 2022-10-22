import {connect, disconnect} from "../service/mongodbService.js";
import {clearWeeklyData} from "../service/campaignService.js";
export async function runWeeklyDataCleaner(req, res) {
    console.log("Clearing weekly data...");

    await connect();

    await clearWeeklyData();
    await disconnect();
    res.send("Done");
}

