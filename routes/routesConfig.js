var common = require('../helper/common.js');
var csession = require("./session.js");
var fs = require("fs");
var path = require("path");
/*
 * 路由信息配制
 */
module.exports = {
    routesConfig: function (app) {
        common.getFilesFromDir("./api/", function (n) {
            var obj_ctl = require("../" + n);
            var action, method;
            for (var m in obj_ctl) {
                var actHandle = obj_ctl[m];
                var route = actHandle.route || {};
                action = route.url || m;
                method = route.method || "GET";
                switch (method.toUpperCase()) {
                    case "GET":
                        app.get(action, generalGetHandle(actHandle));
                        break;
                    case "POST":
                        app.post(action, generalPostHandle(actHandle));
                        break;
                    case "TEST_POST":
                        app.post(action, actHandle);
                        break;
                    case "TEST_GET":
                        app.get(action, actHandle);
                        break;
                }
            }
        });
    }
};
function generalGetHandle(actHandle){
    return function (req, res) {
        csession.validateGetSession(req, res, actHandle);
    };
}
function generalPostHandle(actHandle) {
    return function (req, res) {
        csession.validatePostSession(req, res, actHandle);
    };
}


