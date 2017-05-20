/*
	@banner
	name: jenie
	version: 1.1.3
	author: alexander elias
*/

var Component = require('./component');
var Binder = require('./binder');
var Router = require('./router');
var Http = require('./http');

var sStyle = 'j-view, j-view > :first-child { display: block; }';
var eStyle = document.createElement('style');
var nStyle = document.createTextNode(sStyle);

eStyle.appendChild(nStyle);
document.head.appendChild(eStyle);

document.registerElement('j-view', {
	prototype: Object.create(HTMLElement.prototype)
});

module.exports = {
	module: {},
	services: {},
	http: Http(),
	component: function (options) {
		return Component(options);
	},
	binder: function (options, callback) {
		return Binder(options, callback);
	},
	router: function (options) {
		return this.router = Router(options);
	},
	script: function () {
		return (document._currentScript || document.currentScript);
	},
	document: function () {
		return (document._currentScript || document.currentScript).ownerDocument;
	},
	query: function (query) {
		return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
	}
};
