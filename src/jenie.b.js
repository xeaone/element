/*
	@banner
	name: jenie
	version: 1.2.6
	license: mpl-2.0
	author: alexander elias

	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

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
	services: {},

	http: new Http(),
	module: new Module(),
	router: new Router(),

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
	element: function (name) {
		return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
	},
	query: function (query) {
		return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
	}

};
