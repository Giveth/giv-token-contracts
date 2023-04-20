const axios = require("axios");
const moment = require("moment");
const { dappMailerUrl, givethDevMailList, dappMailerSecret } = process.env;

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
        const data = {
            template: "notification",
            subject: `Notify reward ${farm} ${now}`,
            image: "Giveth-review-banner-email.png",
            text: `
              <table style='${tableStyle}'>
                <tr>
                  <td style='${tableCellStyle}'>Farm</td>
                  <td style='${tableCellStyle}'>${farm}</td>
                </tr>
                <tr>
                  <td style='${tableCellStyle}'>Network</td>
                  <td style='${tableCellStyle}'>${network}</td>
                </tr>
                <tr>
                  <td style='${tableCellStyle}'>Contract address</td>
                  <td style='${tableCellStyle}'>${pool}</td>
                </tr>
                <tr>
                  <td style='${tableCellStyle}'>Amount</td>
                  <td style='${tableCellStyle}'>${amount}</td>
                </tr>
                <tr>
                  <td style='${tableCellStyle}'>Transaction Hash</td>
                  <td style='${tableCellStyle}'>${transactionHash}</td>
                </tr>
                <tr>
                  <td style='${tableCellStyle}'>Round</td>
                  <td style='${tableCellStyle}'>${round}</td>
                </tr>
                <tr>
                  <td style='${tableCellStyle}'>Script</td>
                  <td style='${tableCellStyle}'>${script}</td>
                </tr>
                <tr>
                  <td style='${tableCellStyle}'>Date</td>
                  <td style='${tableCellStyle}'>${now}</td>
                </tr>
                <tr>
                  <td style='${tableCellStyle}'>message</td>
                  <td style='${tableCellStyle}'>${message || ""}</td>
                </tr>
                
              </table>
      `,
            // cta: `Manage Trace`,
            // ctaRelativeUrl: `/campaigns/${data.campaignId}/milestones/${data.traceId}`,
            unsubscribeType: "notifyReward-report",
            unsubscribeReason: `You receive this email because you are in Giv power  team`,
            // message: data.message,
        };

        const summaryMessage = `Notify reward report for ${farm}`;
        data.title = summaryMessage;
        data.secretIntro = summaryMessage;
        const promises = givethDevMailList.split(",").map((recipient) => {
            return axios.post(
                `${dappMailerUrl}/send`,
                {
                    ...data,
                    recipient,
                },
                {
                    headers: {
                        Authorization: dappMailerSecret,
                    },
                },
            );
        });
        return (await Promise.all(promises)).map((response) => response.data);
    } catch (e) {
        console.log("sendReportEmail error", e.message);
        return "Sending email failed";
    }
};

module.exports = { sendReportEmail };
