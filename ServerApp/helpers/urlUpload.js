
const urlUpload = {
    successResponse: (res, result, code, message) => {
        return res.status(code).json({
            data: result,
            message: message,
            statusCode: code,
            statusType: "success"
        })
    },
    errorResponse: (res, code, message) => {
        return res.status(code).json({
            error: "{}",
            message: message,
            statusCode: code,
            statusType: "error"
        })
    },
    requiredResponse: (res, columnName) => {
        return res.status(400).json({
            error: "{}",
            message: columnName + " is required",
            statusCode: 400,
            statusType: "error"
        })
    },
}

module.exports = urlUpload;
