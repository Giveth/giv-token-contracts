const { sendReportEmail } = require("./mailService");


// dappMailerUrl= givethDevMailList'email1,email2 dappMailerSecret=
sendReportEmail({
    payload:{},
    pool:'0xD93d3bDBa18ebcB3317a57119ea44ed2Cf41C2F2',
    farm:'givPower',
    amount:'330000',
    message:'',
    position:1
})
    .then((res) => console.log("send email response", res))
    .catch((e) => console.log("sendReportEmail error", e));
