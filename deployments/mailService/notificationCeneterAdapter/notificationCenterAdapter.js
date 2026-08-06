const axios = require("axios");

const notificationCenterUsername = process.env.NOTIFICATION_CENTER_USERNAME;
const notificationCenterPassword = process.env.NOTIFICATION_CENTER_PASSWORD;
const notificationCenterBaseUrl = process.env.NOTIFICATION_CENTER_BASE_URL;
const disableNotificationCenter = process.env.DISABLE_NOTIFICATION_CENTER;

function createAuthenticationHeader() {
    const str = `${notificationCenterUsername}:${notificationCenterPassword}`;
    return `Basic ${Buffer.from(str).toString("base64")}`;
}

async function sendNotification(data) {
    try {
        if (disableNotificationCenter !== "true") {
            await axios.post(
                `${notificationCenterBaseUrl}/thirdParty/notifications`,
                data,
                {
                    headers: {
                        Authorization: createAuthenticationHeader(),
                    },
                },
            );
        }
    } catch (e) {
        console.error("SendNotification error", {
            errorResponse: e?.response?.data,
            data,
        });
    }
}

export default sendNotification;
