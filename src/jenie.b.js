
/*
	@banner
	name: jenie
	version: 1.6.9
	license: mpl-2.0
	author: alexander elias
	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import Controller from './controller';
import Component from './component';
import Router from './router';
import Loader from './loader';
import Http from './http';

function Jenie () {
	var self = this;

	self.eScript = (document._currentScript || document.currentScript);
	self.http = new Http();
	self.loader = new Loader();
	self.router = new Router({ loader: self.loader });

	self.eStyle = document.createElement('style');
	self.eStyle.setAttribute('title', 'Jenie');
	self.eStyle.setAttribute('type', 'text/css');
	self.eStyle.appendChild(document.createTextNode('j-view, j-view > :first-child { display: block; }'));
	self.eScript.insertAdjacentElement('beforebegin', self.eStyle);

	document.registerElement('j-view', {
		prototype: Object.create(HTMLElement.prototype)
	});

	// j-index="index.js"
	// this.sIndex = this.eScript.getAttribute('j-index');
	// if (this.sIndex) {
	// 	this.eIndex = document.createElement('script');
	// 	this.eIndex.setAttribute('src', this.sIndex);
	// 	this.eIndex.setAttribute('async', 'false');
	// 	this.eScript.insertAdjacentElement('afterend', this.eIndex);
	// }
}

Jenie.prototype.setup = function (options) {
	var self = this;

	options = (typeof options === 'function' ? options.call(self) : options) || {};

	if (options.http) self.http.setup(options.http);
	if (options.loader) self.loader.setup(options.loader);
	if (options.router) self.router.setup(options.router);

	self.router.run();
};

Jenie.prototype.component = function (options) {
	return new Component(options);
};

Jenie.prototype.controller = function (options, callback) {
	return new Controller(options, callback);
};

Jenie.prototype.script = function () {
	return (document._currentScript || document.currentScript);
};

Jenie.prototype.document = function () {
	return (document._currentScript || document.currentScript).ownerDocument;
};

Jenie.prototype.element = function (name) {
	return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
};

Jenie.prototype.query = function (query) {
	return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
};

Jenie.prototype.comments = function (query) {
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
};

Jenie.prototype.escape = function (text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
};

export default new Jenie();
