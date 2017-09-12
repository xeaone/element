
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
import Utility from './utility';
import Router from './router';
import Loader from './loader';
import Model from './model';
import View from './view';
import Http from './http';

var eScript = (document._currentScript || document.currentScript);
var eStyle = document.createElement('style');
var sStyle = document.createTextNode('j-view, j-view > :first-child { display: block; }');

eStyle.setAttribute('title', 'Jenie');
eStyle.setAttribute('type', 'text/css');
eStyle.appendChild(sStyle);
document.head.insertBefore(eStyle, eScript);
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
		options = (typeof options === 'function' ? options.call(this) : options) || {};
		if (options.http) this.http.setup(options.http);
		if (options.view) this.view.setup(options.view);
		if (options.model) this.model.setup(options.model);
		if (options.loader) this.loader.setup(options.loader);
		if (options.router) this.router.setup(options.router);
		this.loader.run();
		this.router.run();
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

Jenie.view.handler(function (addedNodes, removedNodes, parentNode) {
	var addedNode, removedNode, i, l;
	var container = Utility.getContainer(parentNode);

	for (i = 0, l = addedNodes.length; i < l; i++) {
		addedNode = addedNodes[i];
		if (addedNode.nodeType === 1 && !addedNode.isBinded) {
			addedNode.isBinded = true;
			Jenie.view.add(addedNode, container);
		}
	}

	for (i = 0, l = removedNodes.length; i < l; i++) {
		removedNode = removedNodes[i];
		if (removedNode.nodeType === 1) {
			Jenie.view.remove(removedNode, container);
		}
	}
});

Jenie.model.handler(function (data, path) {
	var paths = path.split('.');
	var uid = paths[0];
	var pattern = paths.slice(1).join('.');
	var type = data === undefined ? 'unrender' : 'render';
	Jenie.view.eachBinder(uid, pattern, function (binder) {
		binder[type]();
	});
});

Jenie.router.handler(function (route) {
	if (route.title) document.title = route.title;
	if (route.url && !(route.component in this.cache)) {
		Jenie.loader.load(route.url.constructor === Object ? route.url : {
			url: route.url
		}, function () {
			Jenie.router.render(route);
		});
	} else {
		Jenie.router.render(route);
	}
});

Jenie.view.run();
Jenie.model.run();

export default Jenie;
