var logManager = require("log4js");

module.exports = (function () {
    var log = require("../routes/setupConfig.js");
    logManager.configure(log.logConfig);
    function getLogger(){
        return logManager.getLogger("log_date");
    }
    return getLogger();
})();
