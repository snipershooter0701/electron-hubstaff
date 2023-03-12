const jwt = require('jsonwebtoken');
const md5 = require('md5');
const { errorResponse, successResponse, requiredResponse } = require('../helpers/responseFormat');
const { SECRET_TOKEN } = require('../helpers/constant');
const { EmployeeModel } = require('../model');

async function login(req, res) {
    const Email = req.body.email;
    const Password = req.body.password;

    if (!Email) { return requiredResponse(res, "Email") }
    if (!Password) { return requiredResponse(res, "Password") }

    try {
        let logedIn = await EmployeeModel.findOne({
            email: Email,
            password: md5(Password)
        }).select('-password');

        if (!logedIn) { return errorResponse(res, 400, "This email is not registered"); }

        delete logedIn.password;
        logedIn = logedIn ? logedIn.toJSON() : logedIn;

        if (!logedIn) {
            return errorResponse(res, 400, "Record not found with your current credentials!");
        }

        // Send JWT Token
        const token = jwt.sign(logedIn, SECRET_TOKEN, { expiresIn: '365d' });
        logedIn.token = token;

        // req.session.userData = logedIn;

        return successResponse(res, logedIn, 200, "Login successfully");

    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
}

async function signup(req, res) {
    try {

        let reqBody = req.body;

        if (!reqBody.name) { return requiredResponse(res, "Name") }
        if (!reqBody.email) { return requiredResponse(res, "Email") }

        reqBody.email = (reqBody.email).toLowerCase();

        const userModel = new EmployeeModel({
            name: reqBody.name,
            email: reqBody.email,
            password: reqBody.password ? md5(reqBody.password) : null
        });

        let created = await userModel.save();
        return successResponse(res, created._id, 200, "Inserted successfully");

    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
}

const logout = async (req, res) => {
    req.session.destroy(function (err) {

        if (err) return res.status(400).json({
            status: false,
            message: "Something went wrong"
        })
        res.clearCookie('connect.sid');

        return res.json({
            status: true,
            message: "Logged out successfully"
        });
    })
}

module.exports = {
    login,
    signup,
    logout
}
