var multer = require('multer');
var path = require('path');
var fs = require('fs');
var DIR = path.join(__dirname, '../public/upload');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(DIR)) {
            fs.mkdirSync(DIR);
        }

        cb(null, DIR)
    },
    filename: function (req, file, cb) {
        const str = file.originalname;
        const extension = str.substr(str.lastIndexOf("."));
        const fileName = Date.now() + '' + Math.round(Math.round(Math.random() * 5000)) + '' + extension;
        cb(null, fileName)
    }
});

var uploadFile = multer({
    storage: storage
}).any();

module.exports = {
    uploadFile
}
