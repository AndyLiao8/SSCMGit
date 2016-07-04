var fs = require("fs");
var promise = require("promise");
var spath = require("path");
var constants = require("../helper/constants.js");
var gitManager = require("./gitManager.js");
var fse = require("fs-extra");
var exec = require('child_process').exec;

module.exports = {
    convertDirToZip: convertDirToZip
};

function convertDirToZip(rpname, act, name, callback) {
    gitManager.git.openRepository(rpname, function (rlt) {
        var fd = constants[act];
        if (rlt.s == 1 && fd) {
            var source = spath.join(rlt.p.workdir(), fd);
            var dist = spath.join(rlt.p.workdir(), constants["5"]);
            if (fs.existsSync(source)) {
                var ensureDir = promise.denodeify(fse.ensureDir);
                ensureDir(dist)
                .then(function () {
                    zipArchive(source, dist, name, callback);
                }, function (err) {
                    callback && callback(false, err);
                });
            } else {
                callback && callback(false, "no data");
            }
        } else {
            callback && callback(false, "fail");
        }
    });
}
function zipArchive(source, dist, name, callback) {
    dist = spath.join(dist, name);
    
    var child = exec('zip -ruj \'' + dist + '\' \'' + source + '\'', function (err, stdout, stderr) {
        if (err) {
            callback && callback(false, err);
        } else {
            callback && callback(true, name);
        }
    });
}
