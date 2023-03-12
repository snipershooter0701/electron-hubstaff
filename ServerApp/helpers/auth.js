const { errorResponse } = require("./responseFormat");
const jwt = require("jsonwebtoken");
const { getProfileData } = require("./common");
const { SECRET_TOKEN } = require("./constant");

const verifySession = async (req, res, next) => {

    if (!req.session.userData && !req.headers.authorization) {
        return res.redirect("/login");
    }

    if (req.headers.authorization) {
        let token = req.headers.authorization.replace('Bearer ', '').trim()

        if (token) {
            // verifies secret and checks exp
            jwt.verify(token, SECRET_TOKEN, async function (err, decoded) {
                if (err) {
                    return errorResponse(res, 403, 'Unauthorized');
                } else {
                    req.session.userData = decoded;
                    let updatedUserData = await getProfileData(req.session.userData);

                    req.session.userData = updatedUserData;
                    req.session.userData.admin_request = updatedUserData ? updatedUserData.admin_request : null;
                    return next();
                }
            });
        } else {
            return errorResponse(res, 403, 'Unauthorized');
        }
    } else {
        let updatedUserData = await getProfileData(req.session.userData);
        req.session.userData = updatedUserData;
        req.session.userData.admin_request = updatedUserData ? updatedUserData.admin_request : null;
        return next();
    }

}

const verifySuperAdmin = async (req, res, next) => {

    try {

        if (req.session.userData.is_super_admin == 'Y') {
            return next();
        } else {
            return res.redirect("/login");
        }

    } catch (error) {
        return res.redirect("/login");
    }

}

module.exports = {
    verifySession,
    verifySuperAdmin
}
