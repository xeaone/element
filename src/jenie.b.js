
/*
	@banner
	name: jenie
	version: 1.4.18
	license: mpl-2.0
	author: alexander elias

	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import Controller from './controller';
import Component from './component';
import Router from './router';
import Module from './module';
import Loader from './loader';
import Http from './http';

function Jenie () {
	var sStyle = 'j-view, j-view > :first-child { display: block; }';
	var eStyle = document.createElement('style');
	var nStyle = document.createTextNode(sStyle);

	eStyle.appendChild(nStyle);
	document.head.appendChild(eStyle);

	document.registerElement('j-view', {
		prototype: Object.create(HTMLElement.prototype)
	});

	this.http = new Http();
	this.loader = new Loader();
	this.module = new Module();
	this.router = new Router();

}

Jenie.prototype.setup = function (options) {
	options = (typeof options === 'function' ? options.call(this) : options) || {};

	if (options.http) this.http.setup(options.http);
	if (options.loader) this.loader.setup(options.loader);
	if (options.module) this.module.setup(options.module);
	if (options.router) this.router.setup(options.router);

	this.loader.start('async');
	this.loader.start('defer', function () {
		this.router.start();
	}.bind(this));
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
