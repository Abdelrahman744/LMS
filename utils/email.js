import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, 
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Add this to debug: it verifies the config is correct
    await transporter.verify(); 

    const mailOptions = {
        from: "abdelrahman ashraf <www.ab472005@gmail.com>",
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail;
