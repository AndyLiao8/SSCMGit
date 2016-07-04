"use strict";

var express = require('express');
var route = require('./routes/routesConfig.js');
var http = require('http');
var path = require('path');
var logger = require("./helper/loghelper.js");
var csession = require("./routes/session.js");
var app = express();

// all environments
app.configure(function () {
    app.use(function (req, res, next) {
        csession.setCrossDomain(req, res);
        return next();
    });
});
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.multipart({ uploadDir: './caches' }));
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}
//路由
route.routesConfig(app);

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
process.on('uncaughtException', function (err) {
    logger.error(err);
});
