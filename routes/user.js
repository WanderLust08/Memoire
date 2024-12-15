require('dotenv').config();
const { Router } = require("express");

const User = require("../models/user");
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

// Asynchronous function to send an SMS message using AWS SNS
async function sendSMSMessage(sns, params) {
    // Create a new PublishCommand with the specified parameters
    const command = new PublishCommand(params);
    
    // Send the SMS message using the SNS client and the created command
    const message = await sns.send(command);
    
    // Return the result of the message sending operation
    // return message;
}



const router = Router();
let otp = 0;
router.get("/signin", (req, res) => {
  return res.render("signin");
});

router.get("/signup", (req, res) => {
  return res.render("signup");
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);

    return res.cookie("token", token).redirect("/");
  } catch (error) {
    return res.render("signin", {
      error: "Incorrect Email or Password",
    });
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token").redirect("/");
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password, phone } = req.body;
  console.log(req.body);
  await User.create({
    fullName,
    email,
    password,
  });

  (async () => {
    // Define parameters for the SMS message
    otp = Math.random().toString().substring(2, 8);
    const params = {
        Message: `Your OTP code is: ${otp}`, // Generate a 6-digit OTP code
        PhoneNumber: process.env.PHONE, // Recipient's phone number from environment variables
        MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
                'DataType': 'String',
                'StringValue': 'String'
            }
        }
    };

    // Create an SNS client with the specified configuration
    const sns = new SNSClient({
        region: process.env.REGION, // AWS region from environment variables
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY, // AWS access key from environment variables
            secretAccessKey: process.env.AWS_SECRET_KEY // AWS secret key from environment variables
        }
    });

    // Send the SMS message using the defined SNS client and parameters
    await sendSMSMessage(sns, params);
})();

  return res.redirect("/user/otp");
});

router.post("/otp", async (req, res) => {
  const { otpNumber } = req.body;
  console.log(req.body)
  console.log(otp)
  console.log(otpNumber)
  if(otpNumber == otp){
    return res.redirect("/");
  }else{
    return res.render("otpval", {
      error: "Incorrect OTP",
    });
  }
});


router.get("/otp", (req, res) => {
  return res.render("otpval");
});

module.exports = router;
