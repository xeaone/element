/*
	@banner
	name: jenie
	version: 1.1.5
	author: alexander elias
*/

// if (
// 	!('registerElement' in document) &&
// 	!('import' in document.createElement('link')) &&
// 	!('content' in document.createElement('template'))
// ) {
// 	// polyfill the platform
// 	var eScript = document.createElement('script');
// 	eScript.src = '/webcomponents-lite.min.js';
// 	document.body.appendChild(eScript);
// }

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
	modules: {},
	services: {},
	http: function () {
		return this.http = new Http();
	},
	router: function (options) {
		return this.router = new Router(options);
	},
	component: function (options) {
		return new Component(options);
	},
	binder: function (options, callback) {
		return new Binder(options, callback);
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
