const axios = require("axios");
const moment = require("moment");
const sendNotification = require("./notificationCeneterAdapter/notificationCenterAdapter");
const { givethDevMailList } = process.env;

const sendReportEmail = async ({
    pool,
    farm,
    round,
    amount,
    script,
    message,
    network = "gnosis",
    transactionHash = "",
}) => {
    try {
        const tableStyle =
            "width:100%; border: 1px solid black;  border-collapse: collapse;";
        const tableCellStyle =
            "  text-align: left;padding: 5px; border: 1px solid black;  border-collapse: collapse;";

        /**
         * You can see the dapp-mail code here @see{@link https://github.com/Giveth/dapp-mailer/blob/master/src/services/send/send.hooks.js}
         */
        const now = moment().format("YYYY-MM-DD HH:m:s");
        const payload = {
            round,
            date: now,
            amount: amount.toString(),
            contractAddress: pool,
            farm,
            message,
            network,
            script,
            transactionHash,
        };

        const data = {
            sendEmail: true,
            sendSegment: true,
            eventName: "Notify reward amount",
            metadata: null,
            creationTime: Date.now(),
            segment: {
                payload,
            },
        };
        const promises = givethDevMailList.split(",").map((recipient) => {
            data.email = recipient;
            return sendNotification(data);
        });
        return (await Promise.all(promises)).map((response) => response.data);
    } catch (e) {
        console.log("sendReportEmail error", e.message);
        return "Sending email failed";
    }
};

module.exports = { sendReportEmail };
