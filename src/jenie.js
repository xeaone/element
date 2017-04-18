var Register = require('./register');
var Binder = require('./binder');
var Router = require('./router');
var Http = require('./http');

module.exports = {

	register: Register,
	binder: Binder,
	router: Router,
	http: Http,

	query: function (query) {
		return document.currentScript ? document.currentScript.ownerDocument.querySelector(query) : document._currentScript.ownerDocument.querySelector(query);
	},
	script: function () {
		return document.currentScript ? document.currentScript : document._currentScript;
	},
	document: function () {
		return document.currentScript ? document.currentScript.ownerDocument : document._currentScript.ownerDocument;
	}

};
