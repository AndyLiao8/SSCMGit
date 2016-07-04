"use strict";
var common = require("../helper/common.js");
var sdresult = require("../helper/sdresult.js");

module.exports = (function(){
	function setCrossDomain(req,res){
		res.setHeader('Access-Control-Allow-Origin', '*');
	    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, HEAD, GET, POST, PUT, DELETE');
	    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Range, Content-Disposition');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Content-type', 'application/json;charset=utf-8');
	}
	function validatePostSession(req,res,callback){
		var token="", seed="";
		if(req.body){
			token = req.body.token;
            seed = req.body.seed;
		}else{
            token = req.query.token;
            seed = req.query.seed;
        }
        if (!token || token != common.token(seed)) {
            var resultInfo = new sdresult(999,null,"无效的token值！");
            res.end(resultInfo.getJSON());
            return;
        }
        callback && callback(req, res);
    }
    function validateGetSession(req, res, callback) {
        var token = "", repository = "";
        token = req.query.token;
        repository = req.query.np;
        if (!token || !repository || token != common.token(repository)) {
            var resultInfo = new sdresult(999, null, "无效的请求！");
            res.end(resultInfo.getJSON());
            return;
        }
        callback && callback(req, res);
    }
	return {
        setCrossDomain: setCrossDomain,
        validatePostSession: validatePostSession,
        validateGetSession: validateGetSession
    };
})();