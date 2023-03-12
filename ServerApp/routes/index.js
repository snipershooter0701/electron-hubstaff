
module.exports = function (app) {
    app.use("/auth", require("./auth")),
    app.use("/upload", require("./upload"))
}