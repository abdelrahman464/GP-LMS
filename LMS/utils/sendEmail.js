const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //1- create transporter (services that will send email like =>"gmail","milgun","milltrap")
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // your email address
      pass: process.env.EMAIL_PASSWORD, // your email password
    },
    sender: {
      name: process.env.EMAIL_FROM, // Custom sender name
    },
  });
  //2- define emial options (from ,to ,subject,email content)
  const mailOptions = {
    from: {
      name: process.env.EMAIL_FROM, // Custom sender name
      address: process.env.EMAIL_USER, // Actual sender email address
    },
    // from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
  };
  //3- send email
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
