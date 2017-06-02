/*
	@banner
	name: jenie
	version: 1.1.91
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
var Module = require('./module');
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
	modules: {},
	services: {},
	_module: new Module(),
	module: function (name, method) {
		if (method) {
			return this._module.set(name, method);
		} else {
			return this._module.get(name);
		}
	},
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
