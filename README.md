# 项目描述
基于git的文件服务器，使用语言nodejs，主要使用了下面的包
async: ^1.5.2,<br/>
ejs: *,<br/>
express: 3.4.4,<br/>
fs-extra: ^0.26.5,<br/>
log4js: ~0.6.32,<br/>
md5: ^2.1.0,<br/>
nodegit: ^0.11.9,<br/>
promise: ^7.1.1,<br/>
stylus: *<br/>

注意，本项基于express,但在express上做了点改进，优化了路由配制，提供了权限限制，路由配制如下：
module.exports.createRepo = function (req, res) {
    。。。
};
module.exports.createRepo.route = { url: '/api/createrepo', method: "POST" };
所有的apiController都放在api文件下

# 配制<br/>
module.exports.git = {<br/>
    git_xw: "D:\\ICW\\var\\xw\\", //仓库存储位置<br/>
    git_tempConfig: "D:\\ICW\\var\\template", //指上template文件夹<br/>
    git_userName : "Andy",<br/>
    git_userEmail : "331666229@qq.com",
    wx_downloadurl:"http://file.api.weixin.qq.com/cgi-bin/media/get",<br/>
    appkey: "appkey" //用于加密的key<br/>
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
            "filename": "./logs/date", //配制日志文件
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

# 测试
1，安装好git和nodejs
2, clone项目，cd到当前目录下，输入下面命令：
npm install --save
（在当文件夹下创建node_modules）
3, node app.js
4, 在浏览器输入http://localhost:3000

# 提供的API
1,/api/createrepo
2,/api/upload
3,/api/delete
4 /api/filelist
5 /api/saveDataAsFile
6 /api/compressData
7 /api/httpdownload
8 /api/rename
9 /api/filelog


