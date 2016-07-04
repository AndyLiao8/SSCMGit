var logger = require("../helper/loghelper.js");
var compress = require("../business/compress.js");
var gitManager = require("../business/gitManager.js");
var exec = require('child_process').exec;
var path = require("path");
var fs = require("fs");

module.exports = {};
module.exports.index = function (req, res) {
    gitManager.git.getLogForFile("387144fec4324be7bda9b283b413eb99", "material/sjt-10177-1.jpg", function (falg,out) {
        console.log(out);
    });
    res.setHeader('Content-type', 'text/html');
    res.render("index", {name:"test"});
};
module.exports.index.route = { url: '/', method: "TEST_GET" };

module.exports.upload = function (req, res) {
    gitManager.git.uploadFile(req.files, "MyGit")
    res.end("end");
};
module.exports.upload.route = { url: '/upload', method: "TEST_GET" };


