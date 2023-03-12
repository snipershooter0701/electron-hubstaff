const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const urlTrackingSchema = new mongoose.Schema({
    employee_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    urlName: {
        type: String,
        required: true
    },
    start_time: {
        type: Date,
        required: true
    },
    end_time: {
        type: Date,
        default: Date.now,
        required: true
    },
    time_range: {
        type: Number,
        default: 0,
    }
});

const UrltrackingModel = mongoose.model('urltracking', urlTrackingSchema);
module.exports = UrltrackingModel;
