require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
var bodyParser = require('body-parser');
const routes = require('./routes');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

mongoose.set('strictQuery', true);

let dbConnect = "mongodb://admin:Xoun2iTtu6rnQVz@3.111.125.73:27017/emt";
if (process.env.NODE_ENV == 'production') {
    dbConnect = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.LIVE_DB_URL}/emt`;
}
console.log(dbConnect);

const port = process.env.PORT || 5000;
mongoose
    .connect(dbConnect)
    .then(() => {
        console.log('connected to db');
        app.listen(port, () => {
            console.log(`serve at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.log(err.message);
    });

app.get('/', function (req, res) {
    console.log(req.query);
    return res.send('API is working');
});

app.get('/api', function (req, res) {
    console.log(req.query);
});

routes(app);
