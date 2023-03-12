const moment = require('moment-timezone');
const request = require('request');
moment.tz.setDefault('Asia/Kolkata');
const SettingsModel = require('../app/models').settings;
const Path = require('path');
const { dirname } = require('path');

const UserSchema = require('../app/models/users.model');

const today = () => {
    return moment.utc().format('YYYY-MM-DD HH:mm:ss');
}

const encrypt = (text) => {
    try {
        if (text === null) {
            return null;
        }
        text = text.toString();
        var crypto = require('crypto'),
            key = process.env.CRYPTO_KEY,
            iv = process.env.CRYPTO_IV;

        var encipher = crypto.createCipheriv('aes-256-cbc', key, iv),
            buffer = Buffer.concat([
                encipher.update(text),
                encipher.final()
            ]);
        return buffer.toString('hex');
    }
    catch (e) {
        return null;
    }
}

const decrypt = (text) => {
    try {
        if (text === null) {
            return null;
        }
        var crypto = require('crypto'),
            key = process.env.CRYPTO_KEY,
            iv = process.env.CRYPTO_IV;

        var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv),
            buffer = Buffer.concat([
                decipher.update(Buffer.from(text, 'hex')),
                decipher.final()
            ]);
        return buffer.toString();
    }
    catch (e) {
        return null;
    }
}

const titleCaseString = (str) => {
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
}

const underscoreReplace = (str) => {
    return str.replace(/_/g, ' ');
}

const underscoreNtitleCase = (str) => {
    return titleCaseString(underscoreReplace(str));
}

function generateRandom() {
    var result = "";
    var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function momentDateTimeConverter(params, type) {
    if (!params) {
        return null;
    } else if (type == 'date') {
        return moment(params).format('DD MMM YYYY');
    } else if (type == 'relative') {
        return moment(params).fromNow();
    } else if (type == 'date_time') {
        return moment(params).format('DD MMM YYYY hh:mm A');
    } else {
        return moment(params).format('DD MMM YYYY hh:mm A');
    }
}


const sendNotification = (data) => {
    const Title = data.title;
    const Body = data.body;
    const regToken = data.token_id;

    return new Promise(async (resolve, reject) => {
        try {
            const notification_body = {
                notification: {
                    title: Title,
                    body: Body,
                },
                registration_ids: regToken,
            };

            const notificationToken = await SettingsModel.findAll({
                where: { type: ['fcm_key'] },
            });

            let notifyToken = notificationToken.length ? notificationToken[0]['description'] : "";

            var options = {
                method: 'POST',
                url: 'https://fcm.googleapis.com/fcm/send',
                headers: {
                    Authorization: "key=" + notifyToken,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(notification_body)
            };

            request(options, function (error, response) {
                console.log(error)
                if (error) {
                    return resolve(false);
                }

                if (response.statusCode == 200) {
                    return resolve(true);
                } else {
                    return resolve(false);
                }
            });
        } catch (error) {
            console.log("ERROR->", error);
            return resolve(false);
        }
    });
};


function uploadDir() {
    const appDir = dirname(require.main.filename);
    return Path.join(appDir, '/uploads');
}

async function getProfileData(sessionData) {
    try {

        let userInfo = await UserSchema.findOne({
            _id: sessionData ? sessionData._id : 0
        }).select('-password');

        console.log('userInfo',userInfo);

        delete userInfo.password;

        return userInfo;

    } catch (error) {
        console.log(error)
        return null;
    }
}

module.exports = {
    today,
    encrypt,
    decrypt,
    titleCaseString,
    underscoreReplace,
    underscoreNtitleCase,
    generateRandom,
    momentDateTimeConverter,
    sendNotification,
    uploadDir,
    getProfileData
}

// console.log(sendSMS('916261374761', 'hhhhhhhhhhn'))
