
const capture = require('screenshot-desktop');
const { clearInterval } = require('timers');
const { IPC_CHANNELS } = require('./../enums');
const { getCurrentIdleState, updateActionAPI } = require('./api');
const { appHisTrack, stopAppTrackTimer } = require('./appHisTrack');

var fs = require('fs');
let count = 0, timerId = -1;
let lastEventTime = 0;
let lastMouseEventTime = 0;
let lastKeyEventTime = 0;
let mMouseIdleTotalTime = 0;
let mKeyIdleTotalTime = 0;
let mIdleTimeLimit = 0;
let startTime = 0;
let userData = null;
let currentShotCount = 0;
let currentShotArray = [];

const uploadMouseKeyAction = (type, idleTime = 0, uploadUrlTrack = null) => {
    let current = new Date().getTime();
    timeRange = (new Date().getTime() - startTime) / 1000;
    if (lastKeyEventTime == 0) {
        mKeyIdleTotalTime = timeRange;
        lastKeyEventTime = current;
    }
    if (lastMouseEventTime == 0) {
        mMouseIdleTotalTime = timeRange;
        lastMouseEventTime = current;
    }
    if (idleTime < mIdleTimeLimit) {
        idleTime = 0;
    }
    if (lastEventTime == 0) {
        idleTime = timeRange;
    }
    var updateData = {
        employeeData: userData,
        mouseIdleTime: mMouseIdleTotalTime + (current - lastMouseEventTime) / 1000,
        keyIdleTime: mKeyIdleTotalTime + (current - lastKeyEventTime) / 1000,
        timeRange: timeRange,
        type: type,
        idleTime: idleTime,
        s3shot_count: currentShotCount,
        s3shot_screen_array: currentShotArray
    }


    updateActionAPI(updateData, function (msg) {
        lastEventTime = 0;
        lastMouseEventTime = 0;
        lastKeyEventTime = 0;
        mMouseIdleTotalTime = 0;
        mKeyIdleTotalTime = 0;
        startTime = new Date().getTime();
        currentShotArray = [];
        currentShotCount = 0;
    });
}

const mouseEvent = () => {

    if (timerId != -1) {
        checkMouseKeyBoardAction();
        let currentTime = new Date().getTime();
        if (lastEventTime == 0) {
            lastEventTime = currentTime;
        }
        if (lastMouseEventTime == 0) {
            lastMouseEventTime = currentTime;
        }
        var time = (currentTime - lastMouseEventTime) / 1000;
        if (time >= 1) {
            mMouseIdleTotalTime += time;
        }
        lastMouseEventTime = currentTime;
    }
}
const keyEvent = () => {
    if (timerId != -1) {
        checkMouseKeyBoardAction();
        let currentTime = new Date().getTime();
        if (lastEventTime == 0) {
            lastEventTime = currentTime;
        }
        if (lastKeyEventTime == 0) {
            lastKeyEventTime = currentTime;
        }

        var time = (currentTime - lastKeyEventTime) / 1000
        if (time >= 1) {
            mKeyIdleTotalTime += time;
        }
        lastKeyEventTime = currentTime;
    }
}


function checkMouseKeyBoardAction() {
    if (timerId != -1) {
        let currentTime = new Date().getTime();
        if (lastEventTime == 0) {
            lastEventTime = currentTime;
        }
        if ((currentTime - lastEventTime) / 1000 >= mIdleTimeLimit) {
            uploadMouseKeyAction("idle limit", (currentTime - lastEventTime) / 1000);
        }
        lastEventTime = currentTime;
    }
}

let currentState = null;
let timeOutArray = [];

/**  
 * function is to start capture
 * when play button is clicked
*/
const startCapture = (e, employeeData, uploadToS3) => {
    if (timerId == -1) {   // play capture
        appHisTrack(employeeData._id);
        console.log("============================= play tracking employee ==============================");
        mIdleTimeLimit = employeeData.idleTimeLimit;
        // 1. get current Capture State from server
        getCurrentIdleState(employeeData, function (res, data) {
            currentShotArray = [];
            currentShotCount = 0;
            userData = employeeData;
            currentState = JSON.parse(data);
            var firstData = {
                LeftTime: currentState.LeftTime,
                LeftCaptureCnt: employeeData.screenShotInterval - currentState.LeftCapture
            }


            console.log(firstData);
            currentState = firstData;
            startTime = new Date().getTime();
            e.sender.send(IPC_CHANNELS.PLAY_STATE, {
                state: "played"
            });
            timerId = 0;
            var leftTime = currentState.LeftTime;
            captureAuto(employeeData, uploadToS3);  // for left time
            timeOutArray.push(setTimeout(() => {   // to start 0s
                captureAuto(employeeData, uploadToS3);
                uploadMouseKeyAction("end 1 section", (new Date().getTime() - lastEventTime) / 1000);
                timerId = setInterval(() => {
                    captureAuto(employeeData, uploadToS3);
                    uploadMouseKeyAction("end 1 section", (new Date().getTime() - lastEventTime) / 1000);
                }, 60 * 10 * 1000);   // 10 mins = 60s * 10 
            }, leftTime * 1000));

        });
    } else {   // pause capture
        console.log("============================= pause tracking employee ==============================");
        stopAppTrackTimer();
        uploadMouseKeyAction("pause capture", (new Date().getTime() - lastEventTime) / 1000);
        clearInterval(timerId);
        timeOutArray.forEach(element => {
            clearTimeout(element);
        });
        e.sender.send(IPC_CHANNELS.PLAY_STATE, {
            state: "stopped"
        });
        count = 0;
        timerId = -1;
    }
};

/**  
 * function is upload screenshot auto (random)
*/
let oldTime = 0;
const captureAuto = (employeeData, uploadToS3) => {  // this is random screenshot to upload
    for (var i = 0; i < currentState.LeftCaptureCnt; i++) {
        var time = getRandomInt(currentState.LeftTime, i);
        var timeOut = time + oldTime;
        console.log("screenshot will be captured after " + timeOut + "s");  // upload time during 1 minutes
        currentState.LeftTime -= time;
        if (timerId != -1) {
            timeOutArray.push(setTimeout(() => {
                if (timerId != -1) {
                    captureScreen(employeeData._id, uploadToS3);
                }
            }, timeOut * 1000));
            oldTime = timeOut;
        }
    }
    oldTime = 0;
    currentState.LeftTime = 600;
    currentState.LeftCaptureCnt = employeeData.screenShotInterval;
}

function getRandomInt(max, step) {
    max--;
    if(max > 60 && step == 0)
        return Math.floor(Math.random() * 60) + 1;
    else
        return Math.floor(Math.random() * 60) + 1;
}


/**  
 * function is to capture screenshots and upload them to cloud storage
*/
const captureScreen = (employeeId, uploadToS3) => {
    capture.listDisplays().then(displays => {
        displays.forEach(display => {
            capture({ display: display.id }).then((image) => {
                if ((display.id === "\\\\.\\DISPLAY1") || (display.id === "\\\\.\\DISPLAY2")) {
                    let displayType = 1;
                    if (display.id === "\\\\.\\DISPLAY1") {
                        displayType = 1;
                    }
                    if (display.id === "\\\\.\\DISPLAY2")
                        displayType = 2;
                    let realfilepath = uploadToS3(image, employeeId, displayType);
                    
                    currentShotArray.push({
                        filepath: realfilepath
                    });
                }
            });
        });
        currentShotCount++;
    });
}

module.exports = {
    startCapture, mouseEvent, keyEvent
};