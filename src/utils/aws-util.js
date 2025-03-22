const path = require('path');
const ejs = require('ejs');
const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

const transporter = nodemailer.createTransport({
    SES: ses,
});

const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.AWS_SENDER,
            to,
            subject,
            html,
        });

        return {
            status: true,
            data: info,
        };
    } catch (err) {
        console.error('Error sending email:', err?.message);
        return {
            status: false,
            message: err?.message,
        };
    }
};

const sendEmailTemplateHtml = async ({ to, subject, templateName, params }) => {
    try {
        const html = await ejs.renderFile(path.join(__dirname, `./email-templates/${templateName}`), params);

        return await sendEmail({ to, subject, html });
    } catch (err) {
        console.error('Error sending email:', err?.message);
        return {
            status: false,
            message: err?.message,
        };
    }
};

module.exports = {
    sendEmail,
    sendEmailTemplateHtml,
};
