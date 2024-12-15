
require('dotenv').config();
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const AWS = require('aws-sdk');
const nodemailer = require("nodemailer");
const fs = require('fs');



const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");
const User = require("../models/user");
const { type } = require('os');
const { EndpointDisabledException } = require('@aws-sdk/client-sns');


const router = Router();


const transporter = nodemailer.createTransport({
  SES:new AWS.SES({
    apiVersion:"2010-12-01",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.REGION,
  })
});


// const SES_CONFIG = {
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_KEY,
//   region: process.env.REGION,
// };

// const AWS_SES = new AWS.SES(SES_CONFIG);














const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});

router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );

  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
});

router.post("/comment/:blogId", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});




router.post("/mail/:blogId", async (req, res) => {
  // await Comment.create({
  //   content: req.body.content,
  //   blogId: req.params.blogId,
  //   createdBy: req.user._id,
  // });
  blogId = req.params.blogId;
  const mymail = await Blog.findById(blogId);

  console.log(mymail.title);
  console.log(mymail.body);
  console.log(mymail.coverImageURL)
  
  myuser = mymail.createdBy;
  const user = await User.findById(myuser);


  console.log(user.fullName);
  




  const mailOptions = {
    from: process.env.AWS_SES_SENDER,
    to:process.env.AWS_SES_SENDER,
    subject:`Hello,`+ user.fullName +`!`,
    text:mymail.body,
    html:'<h1>'+mymail.body+'</h1>',
    attachments:[
      {
        filename:"Test.jpg",
        content:fs.createReadStream("\\public"+mymail.coverImageURL)
      }
    ]
  };

  transporter.sendMail(mailOptions,(error,info)=>{
    if(error){
      console.error("ERROR SENDNING EMAIL",error);
    }
    else{
      console.log("EMAIL SENT",info.response);
    }
  });






  // const sendEmail = async (recipientEmail, name,attachment) => {
  //   let params = {
  //     Source: process.env.AWS_SES_SENDER,
  //     Destination: {
  //       ToAddresses: [
  //         recipientEmail
  //       ],
  //     },
  //     ReplyToAddresses: [],
  //     Message: {
  //       Body: {
  //         Html: {
  //           Charset: 'UTF-8',
  //           Data: '<h1>'+mymail.body+'</h1>',
  //         },
  //         Text: {
  //           Charset: "UTF-8",
  //           Data: mymail.body,
  //         }
  //       },
  //       Subject: {
  //         Charset: 'UTF-8',
  //         Data: `Hello, ${name}!`,
  //       }
  //     },
      
  //   };
  
  //   try {
  //     const res = await AWS_SES.sendEmail(params).promise();
  //     console.log('Email has been sent!', res);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }
  


  // sendEmail(process.env.AWS_SES_SENDER, user.fullName);



  return res.redirect(`/blog/${req.params.blogId}`);
});



router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`,
  });
  return res.redirect(`/blog/${blog._id}`);
});

module.exports = router;
