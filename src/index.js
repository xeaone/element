
/*
	@banner
	Name: Jenie
	Version: 1.7.1
	License: MPL-2.0
	Author: Alexander Elias
	Email: alex.steven.elias@gmail.com
	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

import Component from './component';
import Utility from './utility';
import Batcher from './batcher';
import Router from './router';
import Loader from './loader';
import Model from './model';
import View from './view';
import Http from './http';

window.requestAnimationFrame(function () {
	var eScript = (document._currentScript || document.currentScript);
	// var eINDEX = eScript.getAttribute('j-INDEX');
	var eStyle = document.createElement('style');
	var sStyle = document.createTextNode('j-view, j-view > :first-child { display: block; }');
	// if (eINDEX) INDEX.loader.load({ url: eINDEX });
	eStyle.setAttribute('title', 'Jenie');
	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(sStyle);
	document.head.insertBefore(eStyle, eScript);
	document.registerElement('j-view', { prototype: Object.create(HTMLElement.prototype) });
});

// TODO add auth handler

var Jenie = {};

Jenie.container = document.body;

Jenie._ = {};
Jenie.location = {};
Jenie.events = { data: {} };
Jenie.modifiers = { data: {} };

Jenie.http = new Http();
Jenie.view = new View();
Jenie.model = new Model();
Jenie.loader = new Loader();
Jenie.router = new Router();
Jenie.batcher = new Batcher();
Jenie.component = new Component();

Jenie._ = {};
Jenie._.clicks = [];
Jenie._.inputs = [];
Jenie._.changes = [];
Jenie._.popstates = [];
Jenie._.observers = [];

Jenie.script = function () {
	return (document._currentScript || document.currentScript);
};

Jenie.document = function () {
	return (document._currentScript || document.currentScript).ownerDocument;
};

Jenie.element = function (name) {
	return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
};

Jenie.query = function (query) {
	return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
};

Jenie.setup = function (options) {
	options = (typeof options === 'function' ? options.call(this) : options) || {};

	options.http = options.http || {};
	options.loader = options.loader || {};
	options.router = options.router || {};

	options.router.handler = this._.routerHandler;

	this.http.setup(options.http);
	this.loader.setup(options.loader);
	this.router.setup(options.router);

	this.loader.run();
	this.router.run();
};

Jenie._.routerHandler = function (route) {
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
};

Jenie._.viewHandler = function (addedNodes, removedNodes, parentNode) {
	var addedNode, removedNode, containerNode, i;

	i = addedNodes.length;
	while (i--) {
		addedNode = addedNodes[i];
		if (addedNode.nodeType === 1 && !addedNode.inRouterCache) {
			if (addedNode.isRouterComponent) addedNode.inRouterCache = true;
			containerNode = addedNode.uid || Utility.getContainer(parentNode);
			Jenie.view.add(addedNode, containerNode);
		}
	}

	i = removedNodes.length;
	while (i--) {
		removedNode = removedNodes[i];
		if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {
			if (removedNode.isRouterComponent) removedNode.inRouterCache = true;
			containerNode = removedNode.uid || Utility.getContainer(parentNode);
			Jenie.view.remove(removedNode, containerNode);
		}
	}

};

Jenie._.modelHandler = function (data, path) {
	var paths = path.split('.');
	var uid = paths[0];
	var pattern = paths.slice(1).join('.');
	var type = data === undefined ? 'unrender' : 'render';
	Jenie.view.eachBinder(uid, pattern, function (binder) {
		binder[type]();
	});
};

Jenie._.input = Jenie.container.addEventListener('input', function (e) {
	Jenie._.inputs.forEach(function (_input) {
		_input(e);
	});
}, true);

Jenie._.change = Jenie.container.addEventListener('change', function (e) {
	Jenie._.changes.forEach(function (_change) {
		_change(e);
	});
}, true);

Jenie._.click = Jenie.container.addEventListener('click', function (e) {
	Jenie._.clicks.forEach(function (_click) {
		_click(e);
	});
}, true);

Jenie._.popstate = Jenie.container.addEventListener('popstate', function (e) {
	Jenie._.popstates.forEach(function (_popstate) {
		_popstate(e);
	});
}, true);

Jenie._.observer = new window.MutationObserver(function (mutations) {
	Jenie._.observers.forEach(function (_observer) {
		_observer(mutations);
	});
}).observe(Jenie.container, {
	childList: true,
	subtree: true
});

Jenie.component.setup({
	view: Jenie.view,
	model: Jenie.model,
	events: Jenie.events,
	modifiers: Jenie.modifiers
});

Jenie.view.setup({
	handler: Jenie._.viewHandler
});

Jenie.model.setup({
	handler: Jenie._.modelHandler
});

Jenie.view.run();
Jenie.model.run();

export default Jenie;
