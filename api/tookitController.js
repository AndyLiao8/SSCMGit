"use strict";
var spath = require("path");
var gitManager = require("../business/gitManager.js");
var sdresult = require("../helper/sdresult.js");
var common = require("../helper/common.js");

module.exports.getFileByName = function (req, res) {
    var resultInfo = new sdresult();
    
    var name = req.query.np,
        repname = req.query.rep;
    if (!repname || repname == "") {
        resultInfo.status = 1;
        resultInfo.msg = "仓库名字不能为空！";
        res.end(resultInfo.getJSON());
        return;
    }
    if (!name || name == "") {
        resultInfo.status = 1;
        resultInfo.msg = "文件名不能为空！";
        res.end(resultInfo.getJSON());
        return;
    }
    var act = req.query.act || "1";
    name = spath.join(common.resolveMidPath(spath.dirname(name), act), spath.basename(name));
    gitManager.git.getFileByName(name, repname, function (info) {
        
        if (info.status == 0) {
            var ftype = common.contentType(name);
            if (ftype) {
                res.setHeader('Content-type', ftype);
                res.end(info.data);
                return;
            } else {
                resultInfo.status = 3;
                resultInfo.msg = "文件格式不支持！";
            }
        } else {
            resultInfo.status = 2;
            resultInfo.msg = "文件没有找到！";
        }
        res.end(resultInfo.getJSON());
    });
};
//配制路由
module.exports.getFileByName.route = { url: "/file", method: "GET" };

module.exports.download = function (req, res) {
    var resultInfo = new sdresult();
    
    var name = req.query.np,
        repname = req.query.rep;
    if (!repname || repname == "") {
        resultInfo.status = 1;
        resultInfo.msg = "仓库名字不能为空！";
        res.end(resultInfo.getJSON());
        return;
    }
    if (!name || name == "") {
        resultInfo.status = 1;
        resultInfo.msg = "文件名不能为空！";
        res.end(resultInfo.getJSON());
        return;
    }
    var act = req.query.act || "1";
    var baseName = spath.basename(name);
    name = spath.join(common.resolveMidPath(spath.dirname(name), act), baseName);
    gitManager.git.getFileByName(name, repname, function (info) {
        
        if (info.status == 0) {
            res.setHeader("Content-Disposition", "attachment;filename=" + encodeURI(baseName));
            res.setHeader('Content-type', "application/octet-stream");
            res.end(info.data);
        } else {
            resultInfo.status = 2;
            resultInfo.msg = "文件没有找到！";
        }
        res.end(resultInfo.getJSON());
    });
};
//配制路由
module.exports.download.route = { url: "/download", method: "GET" };