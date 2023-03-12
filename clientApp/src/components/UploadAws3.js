
const { CREDENTIALS } = require('./../enums');

var AWS = require('aws-sdk');

AWS.config.update({
    credentials: CREDENTIALS,
    region: 'ap-south-1'
});
// const s3 = new AWS.S3({
//     accessKeyId: "AKIAUUC6CHKCYAO6POXS",
//     secretAccessKey: "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"
// });

const s3 = new AWS.S3();

const uploadToS3 = (file, employeeId, displayType) => {
    var filepath = `${employeeId}/${Date.now()}_${displayType}.png`;
    const s3Params = {
        Bucket: 'emt-image-workship',
        Key: filepath,
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
    return filepath;

};

module.exports = {
    uploadToS3
};