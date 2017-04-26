/*
	@preserve
	name: jenie
	version: 1.0.6
	author: alexander elias
*/

var Component = require('./component');
var Global = require('./global');
var Binder = require('./binder');
var Router = require('./router');
var Http = require('./http');

var S_VIEW_ELEMENT = Global.sViewElement;

document.registerElement(S_VIEW_ELEMENT, {
	prototype: Object.create(HTMLElement.prototype)
});

module.exports = {
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
	query: function (query) {
		return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
	},
	script: function () {
		return (document._currentScript || document.currentScript);
	},
	document: function () {
		return (document._currentScript || document.currentScript).ownerDocument;
	}
};
