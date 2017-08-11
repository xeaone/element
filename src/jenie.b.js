
/*
	@banner
	name: jenie
	version: 1.4.7
	license: mpl-2.0
	author: alexander elias

	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import Component from './component';
import Controller from './controller';
import Polyfills from './polyfills';
import Router from './router';
import Module from './module';
import Http from './http';

var sStyle = 'j-view, j-view > :first-child { display: block; }';
var eStyle = document.createElement('style');
var nStyle = document.createTextNode(sStyle);

eStyle.appendChild(nStyle);
document.head.appendChild(eStyle);

document.registerElement('j-view', {
	prototype: Object.create(HTMLElement.prototype)
});

Polyfills();

export default {

	http: new Http(),
	module: new Module(),
	router: new Router(),

	setup: function (options) {
		options = (typeof options === 'function' ? options.call(this) : options) || {};
		if (options.http) this.http = new Http(options.http);
		if (options.module) this.module = new Module(options.module);
		if (options.router) this.router = new Router(options.router);
		this.router.start();
	},

	component: function (options) {
		return new Component(options);
	},

	controller: function (options, callback) {
		return new Controller(options, callback);
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
	},

	comments: function (query) {
		var comments = [], node;

		var pattern = new RegExp('^' + query);
		var iterator = document.createNodeIterator((document._currentScript || document.currentScript).ownerDocument, NodeFilter.SHOW_COMMENT, NodeFilter.FILTER_ACCEPT);

		while (node = iterator.nextNode()) {
			if (query) {
				if (pattern.test(node.nodeValue)) {
					return node.nodeValue.replace(query, '');
				}
			} else {
				comments.push(node.nodeValue);
			}
		}

		return comments;
	},

	escape: function (text) {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

};
