'use strict';
const Constants = require('./constant');
// const dbQuery = require('../config/database');
const sgMail = require('@sendgrid/mail');
let nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const SettingsModel = require('../app/models').settings;
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const mailSend = {

    async sendMail(data) {

        const emailProvider = await SettingsModel.findOne({ where: { type: 'email_provider' }, raw: true });

        // // let query = `SELECT * from system_settings where type='email_provider_priority_1'`;
        // let result = await dbQuery(query);
        if (emailProvider && emailProvider != '') {
            let email_provider = (emailProvider) ? emailProvider.description : '';
            if (email_provider && email_provider != '') {
                if (email_provider == 'aws_ses') {
                    mailSend.sendAwsSessMail(data);
                }
                else if (email_provider == 'sendgrid') {
                    mailSend.sendSendGridMail(data);
                }
                else if (email_provider == 'mailgun') {
                    mailSend.sendMailgunMail(data);
                }
                else {
                    mailSend.sendSendGridMail(data);
                }
            }
            else {
                mailSend.sendSendGridMail(data);
            }
        }
        else {
            mailSend.sendSendGridMail(data);
        }
    },
    sendMailOld(data) {
        // const getSenderId = await knex('settings').select('*').first();

        if (Constants.mailClient == 'mailgun') {
            // data.attachments

            let attachments = [];
            if (data.attachments) {
                for (let i = 0; i < data.attachments.length; i++) {
                    attachments.push(new mailgun.Attachment({ data: Buffer.from(data.attachments[i].content, 'base64'), filename: data.attachments[i].filename }));
                }
            }

            let mailgunData;
            if (attachments.length > 0) {
                mailgunData = {
                    "from": Constants.senderEmail,
                    "to": data.to,
                    "subject": data.subject,
                    "html": data.body,
                    "attachment": attachments
                };
            }
            else {
                mailgunData = {
                    "from": Constants.senderEmail,
                    "to": data.to,
                    "subject": data.subject,
                    "html": data.body
                };
            }


            mailgun.messages().send(mailgunData, (error, body) => {
                if (error) {
                    return false;
                } else {
                    return body;
                }
            });
        }
        else {
            let mailData = {
                to: data.to,
                from: {
                    email: Constants.senderEmail,
                    name: Constants.senderName
                },
                subject: data.subject,
                html: data.body
            };

            if (data.attachments) {
                mailData["attachments"] = data.attachments;
            }

            return sgMail.send(mailData, (error, result) => {
                console.log(error ? error.response.body : null)
                if (error) {
                    return false;
                } else {
                    return result;
                }
            });
        }
    },
    async sendAwsSessMail(data) {
        let senderEmail = '';
        let smtpUser = '';
        let smtpPass = '';
        // let query = `SELECT * from system_settings where type='aws_ses_sender_email' || type='aws_ses_smtp_user' || type='aws_ses_smtp_password'`;
        // let result = await dbQuery(query);

        const result = await SettingsModel.findAll({ where: {
            [Op.or]: [
                { type: 'aws_ses_sender_email' },
                { type: 'aws_ses_smtp_user' },
                { type: 'aws_ses_smtp_password' },
            ]
        }, raw: true });

        if (result) {
            for (var i = 0; i < result.length; i++) {
                if (result[i].type == 'aws_ses_smtp_user') {
                    smtpUser = result[i].description;
                }
                else if (result[i].type == 'aws_ses_smtp_password') {
                    smtpPass = result[i].description;
                }
                else if (result[i].type == 'aws_ses_sender_email') {
                    senderEmail = result[i].description;
                }
            }
        }

        let transporter = nodemailer.createTransport({
            host: "email-smtp.ap-south-1.amazonaws.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: smtpUser, // generated ethereal user
                pass: smtpPass, // generated ethereal password
            },
        });

        let info;
        if (data.attachment_path != '') {
            info = await transporter.sendMail({
                from: senderEmail,
                to: data.to,
                subject: data.subject,
                html: data.body,
                attachments: data.attachment_path
            });
        }
        else {
            info = await transporter.sendMail({
                from: senderEmail,
                to: data.to,
                subject: data.subject,
                html: data.body,
            });
        }

        if (info) {
            let mailData = (data.attachment_path) ? JSON.stringify(data.attachment_path) : '';
            let currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            // let saveEmailLogQuery = '';
            // if (data.key && data.key == 'exclude_body') {
            //     saveEmailLogQuery = `INSERT INTO email_logs (id, to_email, from_email, subject, body, mail_data,message_id,status,updated_at,created_at) VALUES (NULL, '${data.to}','${senderEmail}','${data.subject}', "",'${mailData}','${info.messageId}','sent_by_aws_ses', '${currentTime}','${currentTime}')`;
            // }
            // else {
            //     saveEmailLogQuery = `INSERT INTO email_logs (id, to_email, from_email, subject, body, mail_data,message_id,status,updated_at,created_at) VALUES (NULL, '${data.to}','${senderEmail}','${data.subject}', "${data.body}",'${mailData}','${info.messageId}','sent_by_aws_ses', '${currentTime}','${currentTime}')`;
            // }
            // if (saveEmailLogQuery != '') {
            //     await dbQuery(saveEmailLogQuery);
            // }

            return info;
        } else {
            return false;
        }
    },
    async sendMailgunMail(data) {
        let senderEmail = '';
        let mailgunApiKey = '';
        let mailgunDomain = '';

        let query = `SELECT * from system_settings where type='mailgun_api_key' || type='mailgun_sender_email' || type='mailgun_domain'`;
        let result = await dbQuery(query);

        if (result) {
            for (var i = 0; i < result.length; i++) {
                if (result[i].type == 'mailgun_api_key') {
                    mailgunApiKey = result[i].description;
                }
                else if (result[i].type == 'mailgun_domain') {
                    mailgunDomain = result[i].description;
                }
                else if (result[i].type == 'mailgun_sender_email') {
                    senderEmail = result[i].description;
                }
            }
        }
        var mailgun = require('mailgun-js')({ apiKey: mailgunApiKey, domain: mailgunDomain });

        let attachments = [];
        if (data.attachments) {
            for (let i = 0; i < data.attachments.length; i++) {
                attachments.push(new mailgun.Attachment({ data: Buffer.from(data.attachments[i].content, 'base64'), filename: data.attachments[i].filename }));
            }
        }

        let mailgunData;
        if (attachments.length > 0) {
            mailgunData = {
                "from": senderEmail,
                "to": data.to,
                "subject": data.subject,
                "html": data.body,
                "attachment": attachments
            };
        }
        else {
            mailgunData = {
                "from": senderEmail,
                "to": data.to,
                "subject": data.subject,
                "html": data.body
            };
        }
        let info = await mailgun.messages().send(mailgunData);
        if (info) {
            let mailData = (data.attachment_path) ? JSON.stringify(data.attachment_path) : '';
            let currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            let saveEmailLogQuery = `INSERT INTO email_logs (id, to_email, from_email, subject, body, mail_data,message_id,status,updated_at,created_at) VALUES (NULL, '${data.to}','${senderEmail}','${data.subject}', "${data.body}",'${mailData}','${info.id}','sent_by_mailgun', '${currentTime}','${currentTime}')`;
            await dbQuery(saveEmailLogQuery);
        }
        else {
            return false;
        }
        // await mailgun.messages().send(mailgunData, (error, body) => {
        //     if (error) {
        //         console.log(error);
        //         return false;
        //     } else {
        //         return body;
        //     }
        // });
    },
    async sendSendGridMail(data) {

        let senderEmail = '';
        let senderName = '';
        let mailApiKey = '';

        // let query = `SELECT * from system_settings where type='sendgrid_api_key' || type='sendgrid_sender_email' || type='sendgrid_sender_name'`;

        const result = await SettingsModel.findAll({ where: {
            [Op.or]: [
                { type: 'sendgrid_api_key' },
                { type: 'sendgrid_sender_name' },
                { type: 'sendgrid_sender_email' },
            ]
        }, raw: true });

        console.log('SENDGRID RESULT', result);

        if (result) {
            for (var i = 0; i < result.length; i++) {
                if (result[i].type == 'sendgrid_api_key') {
                    mailApiKey = result[i].description;
                }
                else if (result[i].type == 'sendgrid_sender_email') {
                    senderEmail = result[i].description;
                }
                else if (result[i].type == 'sendgrid_sender_name') {
                    senderName = result[i].description;
                }
            }
        }

        sgMail.setApiKey(mailApiKey);

        let mailData = {
            to: data.to,
            from: {
                email: senderEmail,
                name: senderName
            },
            subject: data.subject,
            html: data.body
        };

        if (data.attachments) {
            mailData["attachments"] = data.attachments;
        }

        let info = await sgMail.send(mailData, (error, result) => {
            console.log('result', result);
            console.log(error ? error : null)
            if (error) {
                return false;
            } else {
                return result;
            }
        });
        if (info) {
            let mailData = (data.attachment_path) ? JSON.stringify(data.attachment_path) : '';
            let currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            // let saveEmailLogQuery = `INSERT INTO email_logs (id, to_email, from_email, subject, body, mail_data,message_id,status,updated_at,created_at) VALUES (NULL, '${data.to}','${senderEmail}','${data.subject}', "${data.body}",'${mailData}','${info[0].headers['x-message-id']}','sent_by_sendgrid', '${currentTime}','${currentTime}')`;
            // await dbQuery(saveEmailLogQuery);
            return info;
        }
    },
}

module.exports = mailSend;