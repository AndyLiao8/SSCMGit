"use strict";

module.exports = class {
	constructor(status,data,msg){
		this.status = status || 999;
		this.data = data || {};
		this.msg = msg || "";
    }
    reset() {
        this.status = 999;
        this.data = {};
        this.msg = "";
    }
	getJSON(){
		return JSON.stringify(this);
	}
};