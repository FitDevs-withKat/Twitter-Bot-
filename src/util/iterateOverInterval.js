export async function iterateOverInterval(interval, data, callback) {
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

        }, interval);
    });
}
