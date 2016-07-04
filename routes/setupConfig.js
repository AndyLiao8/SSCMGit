module.exports.git = {
    git_xw: "D:\\ICW\\var\\xw\\",
    git_tempConfig: "D:\\ICW\\var\\template",
    git_userName : "sscm",
    git_userEmail : "sscmservice@sscm.cc",
    wx_downloadurl:"http://file.api.weixin.qq.com/cgi-bin/media/get",
    appkey: "appkey"
};
module.exports.logConfig = {
    "appenders":
 [
        {
            "type": "console",
            "category": "console"
        },
        {
            "category": "log_date",
            "type": "dateFile",
            "filename": "./logs/date",
            "alwaysIncludePattern": true,
            "pattern": "-yyyy-MM-dd.log"

        }
    ],
    "replaceConsole": true,
    "levels":
 {
        "log_date": "ALL",
        "console": "ALL"
    }
};