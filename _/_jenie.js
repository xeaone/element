
/*
	@banner
	name: ure
	version: 1.7.1
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
var eIndex = eScript.getAttribute('u-index');
var eStyle = document.createElement('style');
var sStyle = document.createTextNode('u-view, u-view > :first-child { display: block; }');

eStyle.setAttribute('title', 'Ure');
eStyle.setAttribute('type', 'text/css');
eStyle.appendChild(sStyle);
document.head.insertBefore(eStyle, eScript);
document.registerElement('u-view', { prototype: Object.create(HTMLElement.prototype) });

var Ure = {
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
		options.global = Ure;
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
	}
};

Ure.view.handler(function (addedNodes, removedNodes, parentNode) {
	var addedNode, removedNode, containerNode, i;

	i = addedNodes.length;
	while (i--) {
		addedNode = addedNodes[i];
		if (addedNode.nodeType === 1 && !addedNode.inRouterCache) {
			if (addedNode.isRouterComponent) addedNode.inRouterCache = true;
			containerNode = addedNode.uid || Utility.getContainer(parentNode);
			Ure.view.add(addedNode, containerNode);
		}
	}

	i = removedNodes.length;
	while (i--) {
		removedNode = removedNodes[i];
		if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {
			if (removedNode.isRouterComponent) removedNode.inRouterCache = true;
			containerNode = removedNode.uid || Utility.getContainer(parentNode);
			Ure.view.remove(removedNode, containerNode);
		}
	}

});

Ure.model.handler(function (data, path) {
	var paths = path.split('.');
	var uid = paths[0];
	var pattern = paths.slice(1).join('.');
	var type = data === undefined ? 'unrender' : 'render';
	Ure.view.eachBinder(uid, pattern, function (binder) {
		binder[type]();
	});
});

Ure.router.handler(function (route) {
	if (route.title) document.title = route.title;
	if (route.url && !(route.component in this.cache)) {
		Ure.loader.load(route.url.constructor === Object ? route.url : {
			url: route.url
		}, function () {
			Ure.router.render(route);
		});
	} else {
		Ure.router.render(route);
	}
});

Ure.view.run();
Ure.model.run();

if (eIndex) {
	Ure.loader.load({ url: eIndex });
}

export default Ure;
