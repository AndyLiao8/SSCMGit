var fs = require("fs");
var http = require('http');
var config = require("../routes/setupConfig.js");
var fileTypeList = require("../helper/fileTypeList.js");
var constants = require("../helper/constants.js");
var spath = require("path");
var md5 = require("md5");

module.exports = {
    createIdentifyID: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    },
    token : function (msg) {
        return md5(config.git.appkey + "-" + (msg || ""));
    },
    contentType: function (name){
        return fileTypeList[getFileType(name)];
    },
    getDetailFolder: function (p,t){
        var lth = p.lastIndexOf(".");
        if (lth > 0)
            p = p.substr(0, lth);
        return p + constants[t];
    },
    getNameWithoutExt: function (name){
        var ext = spath.extname(name);
        return spath.basename(name, ext);
    },
    removeRelatedInfo: function (name,index){
        var self = this;
        for (var propKey in constants) {
            var fp = self.getDetailFolder(name, propKey);
            if (fs.existsSync(fp)) {
                index.removeDirectory(fp, 0);
            }
        }
    },
    resolveMidPath: function (path, act) {
        if (!act)
            act = "1";
        var fd = constants[act];
        if (fd) {
            switch (act) {
                case "1":
                    return spath.join(fd, path);
                case "2":
                case "3":
                case "4":
                case "5":
                    return fd;
                default:
                    return path;
            }
        }
        return path;
    },
    resolveFiles: function (filepaths, act) {
        if (!act)
            act = "1";
        var fd = constants[act];
        if (fd && filepaths) {
            var rlt = [];
            var lth = filepaths.length;
            for (var i = 0; i < lth; i++) {
                var fpath = filepaths[i];
                switch (act) {
                    case "1":
                        rlt.push(spath.join(fd, fpath));
                        break;
                    case "2":
                    case "3":
                    case "4":
                    case "5":
                        rlt.push(spath.join(fd, spath.basename(fpath)));
                        break;
                    default:
                        rlt.push(fpath);
                        break;
                }
            }
            return rlt;
        }
        return filepaths;
    },
    getFilesFromDir: getFilesFromDir,
    downloadFileViaHttp: downloadFileViaHttp
}
function getFileType(name) {
    var ext = spath.extname(name);
    if (ext && ext.length > 1)
        return ext.substring(1).toLowerCase();
    return "";
}
function getFilesFromDir(fph, callback) {
     var files = fs.readdirSync(fph);
     files.forEach(function (file)
     {
          var states = fs.statSync(spath.join(fph , file));  
          if (states.isDirectory())
          {
              readFile(spath.join(fph, file), callback);
  
          }
          else
          {
              callback && callback(spath.join(fph, file));
          }  
    });
}
function downloadFileViaHttp(soure, dist, callback){
    var file = fs.createWriteStream(dist);
    var request = http.get(soure, function (response) {
        response.pipe(file);
        callback && callback();
    });
}
function formatLog(ct){
    if (ct === "") return "";
    var regExp = /\n/;
    var arr = ct.split(regExp);
    if (arr.length <= 0) return "";
    
    var reg_commit = /commit\s+/;
    var reg_Author = /Author\:+/;
    var reg_Date = /Date\:+/;
    var reg_Msg = /^\s{1,4}/;
    
    var arr_log = [];
    var lth = arr.length;
    var logItem = null;
    for (var i = 0; i < lth; i++) {
        var item = arr[i];
        if (reg_commit.test(item)) {
            logItem = {};
            logItem["commit"] = item.replace(reg_commit, "");
            arr_log.push(logItem);
        }
        if (reg_Author.test(item)) {
            logItem["author"] = item.replace(reg_Author, "");
        }
        if (reg_Date.test(item)) {
            logItem["date"] = item.replace(reg_Date, "");
        }
        if (reg_Msg.test(item)) {
            var matchedInfo = /\'(.*?)\'/.exec(item);
            if (matchedInfo && matchedInfo.length > 1)
                logItem["msg"] = matchedInfo[1];
            else
                logItem["msg"] = "";
        }
    }
    return arr_log;
}
module.exports.formatLog = formatLog;