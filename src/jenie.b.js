/*
	@preserve
	name: jenie
	version: 1.0.4
	author: alexander elias
*/

var Register = require('./register');
var Binder = require('./binder');
var Router = require('./router');
var Http = require('./http');

document.createElement('style').appendChild(document.createTextNode(''));

document.registerElement('j-view', {
	prototype: Object.create(HTMLElement.prototype)
});

module.exports = {

	register: Register,
	router: Router,
	binder: Binder,
	http: Http,

	services: {},

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
