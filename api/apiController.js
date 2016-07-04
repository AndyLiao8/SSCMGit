"use strict";
var logger = require("../helper/loghelper.js");
var gitManager = require("../business/gitManager.js");
var sdresult = require("../helper/sdresult.js");
var common = require("../helper/common.js");
var compress = require("../business/compress.js");
var spath = require("path");
var fse = require("fs-extra");

module.exports = {};
module.exports.createRepo = function (req, res) {
    var repname = req.body.repname,
        resultInfo = new sdresult();
    if (!repname || repname == "") {
        resultInfo.status = 1;
        resultInfo.msg = "仓库名字不能为空！";
        res.end(resultInfo.getJSON());
        return;
    }
    gitManager.git.createRepository(repname, function (flag, msg) {
        if (flag) {
            resultInfo.status = 0;
        } else {
            resultInfo.status = 1;
            resultInfo.msg = msg;
        }
        res.end(resultInfo.getJSON());
    });
};
module.exports.createRepo.route = { url: '/api/createrepo', method: "POST" };

module.exports.uploadFile = function (req, res) {
    var resultInfo = new sdresult();
    if (!req.files) {
        resultInfo.status = 1;
        resultInfo.msg = "上传文件失败";
        res.end(resultInfo.getJSON());
        return;
    }
    var repname = req.body.repname || "";
    if (repname == "") {
        resultInfo.status = 1;
        resultInfo.msg = "仓库名字不能为空！";
        res.end(resultInfo.getJSON());
        return;
    }
    var act = req.body.act || "1";
    var midPath = common.resolveMidPath((req.body.midpath || ""), act);
    gitManager.git.uploadFile(req.files, midPath, repname, function (flag, info) {
        if (flag) {
            resultInfo.status = 0;
        } else {
            resultInfo.status = 1;
            resultInfo.msg = info;
        }
        res.end(resultInfo.getJSON());
    });
};
module.exports.uploadFile.route = { url: '/api/upload', method: "POST" };

module.exports.deleteFile = function (req, res) {
    var resultInfo = new sdresult();
    var fnames = req.body.names,
        repname = req.body.repname;
    if (!repname || repname == "") {
        resultInfo.status = 1;
        resultInfo.msg = "仓库名字不能为空！";
        res.end(resultInfo.getJSON());
        return;
    }
    if (!fnames || fnames == "") {
        resultInfo.status = 1;
        resultInfo.msg = "没有选中要删除的文件";
        res.end(resultInfo.getJSON());
        return;
    }
    var act = req.body.act || "1";
    fnames = common.resolveFiles(JSON.parse(fnames), act);
    gitManager.git.deleteFile(fnames, repname, function (flag, info) {
        if (flag) {
            resultInfo.status = 0;
        } else {
            resultInfo.status = 1;
            resultInfo.msg = info;
        }
        res.end(resultInfo.getJSON());
    });
};
module.exports.deleteFile.route = { url: '/api/delete', method: "POST" };

module.exports.getFiles = function (req, res) {
    var resultInfo = new sdresult();
    var repname = req.body.repname;
    if (!repname || repname == "") {
        resultInfo.status = 1;
        resultInfo.msg = "仓库名字不能为空！";
        res.end(resultInfo.getJSON());
        return;
    }
    var act = req.body.act || "1";
    var midPath = common.resolveMidPath((req.body.midpath || ""), act);
    gitManager.git.getFiles(repname, midPath, function (flag,info) {
        if (flag) {
            resultInfo.status = 0;
            resultInfo.data = info;
        } else {
            resultInfo.status = 1;
            resultInfo.msg = info;
        }
        res.end(resultInfo.getJSON());
    });
};
module.exports.getFiles.route = { url: '/api/filelist', method: "POST" };

module.exports.saveDataAsFile = function (req, res){
    var resultInfo = new sdresult();
    var paras = {};
    paras.repname = req.body.repname || "";
    if (paras.repname == "") {
        resultInfo.status = 1;
        resultInfo.msg = "仓库名字不能为空！";
        res.end(resultInfo.getJSON());
        return;
    }
    paras.name = req.body.name || "";
    if (paras.name == "") {
        resultInfo.status = 1;
        resultInfo.msg = "参数据不对！";
        res.end(resultInfo.getJSON());
        return;
    }
    paras.ct = req.body.ct || "";
    paras.act = req.body.act || "1";
    paras.midpath = common.resolveMidPath((req.body.midpath || ""), paras.act);
    paras.name = common.getNameWithoutExt(paras.name) + ".json";
    paras.newname = common.getNameWithoutExt(req.body.newname || paras.name) + ".json";
    gitManager.git.saveData(paras, function (flag,info) {
        if (flag) {
            resultInfo.status = 0;
        } else {
            resultInfo.status = 1;
            resultInfo.msg = info;
        }
        res.end(resultInfo.getJSON());
    });
}
module.exports.saveDataAsFile.route = { url: '/api/saveDataAsFile', method: "POST" };

module.exports.compressWithZip = function (req, res) {
    var resultInfo = new sdresult();
    var repname = req.body.repname || "";
    if (repname == "") {
        resultInfo.status = 1;
        resultInfo.msg = "仓库名字不能为空！";
        res.end(resultInfo.getJSON());
        return;
    }
    var act = req.body.act || "1";
    var name = req.body.name || repname + "_data.zip";
    compress.convertDirToZip(repname, act, name, function (flag, info) {
        if (flag) {
            resultInfo.status = 0;
            resultInfo.data.name = info;
        } else {
            resultInfo.status = 1;
            resultInfo.msg = info;
        }
        res.end(resultInfo.getJSON());
    });
}
module.exports.compressWithZip.route = { url: '/api/compressData', method: "POST" };

module.exports.downloadFileFromWX = function (req, res) {
    var resultInfo = new sdresult();
    var repname = req.body.repname || "";
    var midpath = req.body.midpath || "";
    var name = req.body.name || "";
    var access_token = req.body.accesstoken || "";
    var media_id = req.body.mediaid || "";
    var act = req.body.act || "1";
    
    if (repname == "" ||
        name == "" ||
        access_token == "" ||
        media_id == ""
        ) {
        resultInfo.status = 1;
        resultInfo.msg = "参数不对！";
        res.end(resultInfo.getJSON());
        return;
    }
    midpath = common.resolveMidPath(midpath, act);
    var abPath = spath.join(gitManager.git.git_position, repname, midpath, name);
    var mediaPath = gitManager.git.wx_downloadurl + "?access_token=" + access_token + "&media_id=" + media_id;
    fse.ensureFileSync(abPath);
    common.downloadFileViaHttp(mediaPath, abPath, function () {
        gitManager.git.commitFiles(repname, function (index) {
            index.addByPath(spath.join(midpath, name));
        }, function (flag, info) {
            if (flag) {
                resultInfo.status = 0;
                resultInfo.data.name = info;
            } else {
                resultInfo.status = 1;
                resultInfo.msg = info;
            }
            res.end(resultInfo.getJSON());
        });
    });
}
module.exports.downloadFileFromWX.route = { url: '/api/httpdownload', method: "POST" };

module.exports.renameFile = function (req, res) {
    var resultInfo = new sdresult();
    var repname = req.body.repname || "";
    var name = req.body.name || "";
    var newName = req.body.newname || "";
    var act = req.body.act || "1";

    if (repname == "" ||
        name == "" ||
        newName == ""
        ) {
        resultInfo.status = 1;
        resultInfo.msg = "参数不对！";
        res.end(resultInfo.getJSON());
        return;
    }
    var midPath = common.resolveMidPath((req.body.midpath || ""), act);
    name = spath.join(midPath, name);
    newName = spath.join(midPath, newName);
    gitManager.git.renameFile(repname, name, newName, function (flag, info) {
        if (flag) {
            resultInfo.status = 0;
            resultInfo.data.name = info;
        } else {
            resultInfo.status = 1;
            resultInfo.msg = info;
        }
        res.end(resultInfo.getJSON());
    });
};
module.exports.renameFile.route = { url: '/api/rename', method: "  POST" };

module.exports.getLogForFile = function (req, res) {
    var resultInfo = new sdresult();
    var repname = req.body.repname || "";
    var name = req.body.name || "";
    var act = req.body.act || "1";
    
    if (repname == "" ||
        name == ""
        ) {
        resultInfo.status = 1;
        resultInfo.msg = "参数不对！";
        res.end(resultInfo.getJSON());
        return;
    }
    var midPath = common.resolveMidPath((req.body.midpath || ""), act);
    name = spath.join(midPath, name);
    gitManager.git.getLogForFile(repname, name, function (flag, info) {
        if (flag) {
            resultInfo.status = 0;
            resultInfo.data.name = info;
        } else {
            resultInfo.status = 1;
            resultInfo.msg = info;
        }
        res.end(resultInfo.getJSON());
    });
};
module.exports.getLogForFile.route = { url: '/api/filelog', method: "  POST" };