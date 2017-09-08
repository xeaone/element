
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

import Component from './component';
import Router from './router';
import Loader from './loader';
import Model from './model';
import View from './view';
import Http from './http';

var eScript = (document._currentScript || document.currentScript);
var eStyle = document.createElement('style');

eStyle.setAttribute('title', 'Jenie');
eStyle.setAttribute('type', 'text/css');
eStyle.appendChild(document.createTextNode('j-view, j-view > :first-child { display: block; }'));
eScript.insertAdjacentElement('beforebegin', eStyle);

document.registerElement('j-view', { prototype: Object.create(HTMLElement.prototype) });

// j-index="index.js"
// this.sIndex = this.eScript.getAttribute('j-index');
// if (this.sIndex) {
// 	this.eIndex = document.createElement('script');
// 	this.eIndex.setAttribute('src', this.sIndex);
// 	this.eIndex.setAttribute('async', 'false');
// 	this.eScript.insertAdjacentElement('afterend', this.eIndex);
// }

var Jenie = {
	container: document.body,

	events: { data: {} },
	modifiers: { data: {} },

	http: new Http(),
	view: new View(),
	model: new Model(),
	loader: new Loader(),
	router: new Router(),

	setup: function (options) {
		var self = this;

		options = (typeof options === 'function' ? options.call(self) : options) || {};

		if (options.http) self.http.setup(options.http);
		if (options.view) self.view.setup(options.view);
		if (options.model) self.model.setup(options.model);
		if (options.loader) self.loader.setup(options.loader);
		if (options.router) self.router.setup(options.router);

		self.model.run();
		self.view.run();
		self.router.run();
	},

	component: function (options) {
		options.global = Jenie;
		return new Component(options);
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

	escape: function (text) {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
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
	}

};

Jenie.model.handler(function (data, path) {
	var paths = path.split('.');
	var uid = paths[0];
	var pattern = paths.slice(1).join('.');
	var type = data === undefined ? 'unrender' : 'render';

	Jenie.view.forEach(uid, pattern, function (binders) {
		for (var i = 0, l = binders.length; i < l; i++) {
			binders[i][type]();
		}
	});
});

Jenie.router.handler(function (route) {
	if (route.title) document.title = route.title;
	if (route.file && !(route.component in this.cache)) {
		Jenie.loader.run(route.file.constructor === Object ? route.file : {
			file: route.file
		}, function () {
			Jenie.router.render(route);
		});
	} else {
		Jenie.router.render(route);
	}
});

export default Jenie;
