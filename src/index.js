import Component from './component';
import Utility from './utility';
import Batcher from './batcher';
import Router from './router';
import Loader from './loader';
import Model from './model';
import View from './view';
import Http from './http';

// TODO add auth handler

var Ure = {};

Ure.container = document.body;
Ure.currentScript = (document._currentScript || document.currentScript);

Ure._ = {};
Ure.location = {};
Ure.events = { data: {} };
Ure.modifiers = { data: {} };

Ure.http = new Http();
Ure.view = new View();
Ure.model = new Model();
Ure.loader = new Loader();
Ure.router = new Router();
Ure.batcher = new Batcher();
Ure.component = new Component();

Ure._ = {};
Ure._.clicks = [];
Ure._.inputs = [];
Ure._.changes = [];
Ure._.popstates = [];
Ure._.observers = [];

Ure.script = function () {
	return (document._currentScript || document.currentScript);
};

Ure.document = function () {
	return (document._currentScript || document.currentScript).ownerDocument;
};

Ure.element = function (name) {
	return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
};

Ure.query = function (query) {
	return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
};

Ure.setup = function (options) {
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

Ure._.routerHandler = function (route) {
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
};

Ure._.viewHandler = function (addedNodes, removedNodes, parentNode) {
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

};

Ure._.modelHandler = function (data, path) {
	var paths = path.split('.');
	var uid = paths[0];
	var pattern = paths.slice(1).join('.');
	var type = data === undefined ? 'unrender' : 'render';
	Ure.view.eachBinder(uid, pattern, function (binder) {
		binder[type]();
	});
};

Ure._.input = Ure.container.addEventListener('input', function (e) {
	Ure._.inputs.forEach(function (_input) {
		_input(e);
	});
}, true);

Ure._.change = Ure.container.addEventListener('change', function (e) {
	Ure._.changes.forEach(function (_change) {
		_change(e);
	});
}, true);

Ure._.click = Ure.container.addEventListener('click', function (e) {
	Ure._.clicks.forEach(function (_click) {
		_click(e);
	});
}, true);

Ure._.popstate = Ure.container.addEventListener('popstate', function (e) {
	Ure._.popstates.forEach(function (_popstate) {
		_popstate(e);
	});
}, true);

Ure._.observer = new window.MutationObserver(function (mutations) {
	Ure._.observers.forEach(function (_observer) {
		_observer(mutations);
	});
}).observe(Ure.container, {
	childList: true,
	subtree: true
});

Ure.component.setup({
	view: Ure.view,
	model: Ure.model,
	events: Ure.events,
	modifiers: Ure.modifiers
});

Ure.view.setup({
	handler: Ure._.viewHandler
});

Ure.model.setup({
	handler: Ure._.modelHandler
});

Ure.view.run();
Ure.model.run();

window.requestAnimationFrame(function () {
	var eStyle = document.createElement('style');
	var sStyle = document.createTextNode('u-view, u-view > :first-child { display: block; }');
	eStyle.setAttribute('title', 'Ure');
	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(sStyle);
	document.head.insertBefore(eStyle, Ure.currentScript);
	document.registerElement('u-view', { prototype: Object.create(HTMLElement.prototype) });
	var eIndex = Ure.currentScript.getAttribute('u-index');
	if (eIndex) Ure.loader.load({ url: eIndex });
});

export default Ure;
