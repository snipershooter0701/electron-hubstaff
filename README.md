# electron-hubstaff

#building app file

windows:  electron-packager ./ electron-hubstaff --platform=win32 --arch=x64

mac:  electron-packager ./ electron-hubstaff --overwrite --platform=darwin --arch=x64 --prune=true --out=release-builds

linux:  electron-packager ./ electron-hubstaff --overwrite --asar=true --platform=linux --arch=x64 --icon=assets/icons/png/1024x1024.png --prune=true --out=release-builds

#upload AWS S3 bucket-1

const AWS = require('aws-sdk');
const robot = require("robotjs");

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const uploadToS3 = (file, employeeId) => {
    const s3Params = {
        Bucket: 'my-employee-screenshots',
        Key: `${employeeId}/${Date.now()}.png`,
        Body: file,
        ContentType: 'image/png'
    };

    s3.upload(s3Params, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            console.log(`File uploaded to S3: ${data.Location}`);
        }
    });
};

#display screen capture and upload AWS S3 bucket-2

const s3 = new AWS.S3();
const capture = require('node-screen-capture');
const sharp = require('sharp');

capture.listDisplays().then(displays => {
    displays.forEach(display => {
        capture.captureScreen({display: display.id}).then(img => {
            sharp(img).resize({ width: 100, height: 100 }).toBuffer((err, buffer) => {
                if (err) {
                    console.error(err);
                }
                const params = {
                    Bucket: 'my-bucket',
                    Key: 'screenshot.png',
                    Body: buffer
                };
                s3.upload(params, function(err, data) {
                    if (err) {
                        console.error(err);
                    }
                    console.log(`Screenshot successfully uploaded to ${data.Location}`);
                });
            });
        });
    });
});

