const req = require('request');
const { IPC_URL } = require('../enums');
const { dialog } = require('electron')
/* 
    login and get user data
*/
function settingAPI({}, callback) {
    // console.log("========================start get settings data==========================");
    // var clientServerOptions = {
    //     url: IPC_URL.WEBSERVER_URL + IPC_URL.SETTING_URL,
    //     body: JSON.stringify({}),
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // }

    // req(clientServerOptions, function (error, res) {
    //     if(error) {
    //         const options = {
    //             type: 'info',
    //             message: 'Connection Error!'
    //         };
    //         dialog.showMessageBox(null, options);
    //     }
    //     else {
    //         console.log(res.body);
    //         var values = JSON.parse(res.body);
    //         callback(error, values);
    //     }
    // });
}

/* 
    login and get user data
*/
function loginAPI(username, password, callback) {

    console.log("========================start login==========================");
    var userInfo = {
        email: username,
        password: password
    };

    var clientServerOptions = {
        url: IPC_URL.WEBSERVER_URL + IPC_URL.VERIFYUSER_URL,
        body: JSON.stringify(userInfo),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }

    req(clientServerOptions, function (error, res) {
        if(error) {
            const options = {
                type: 'info',
                message: 'Connection Error!'
            };
            dialog.showMessageBox(null, options);
        }
        else {
            var values = JSON.parse(res.body);
            callback(error, values);
        }
    });
}

/*
    when play button is clicked 
    - get current server time
    - get current capture state in current time(10mins) ;
*/
function getCurrentIdleState(employeeData, callback) {
    var url = IPC_URL.WEBSERVER_URL + IPC_URL.GETCURRENTSTATE_URL + "?employeeId=";
    url = url.concat(employeeData._id);
    req.get(url, function (err, res, body) {
        if (err) {
            const options = {
                type: 'info',
                message: 'Connection Error!'
            };
            dialog.showMessageBox(null, options);
        }
        else {
            callback(res, body);
        }
    });
}


/* 
    update idletime and mouse/keyboard state
*/
function updateActionAPI(actionData, callback) {
    console.log("========================start update action==========================");
    console.log(JSON.stringify(actionData));
    var clientServerOptions = {
        uri: IPC_URL.WEBSERVER_URL + IPC_URL.UPLOADSTATE_URL,
        body: JSON.stringify(actionData),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    req(clientServerOptions, function (error, response) {
        callback();
        return;
    });

}

module.exports = {
    loginAPI, getCurrentIdleState, updateActionAPI, settingAPI
}