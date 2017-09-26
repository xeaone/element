import Component from './component';
import Utility from './utility';
import Batcher from './batcher';
import Router from './router';
import Loader from './loader';
import Model from './model';
import View from './view';
import Http from './http';

// TODO add auth handler

var Oxe = {};

Oxe.container = document.body;
Oxe.currentScript = (document._currentScript || document.currentScript);

Oxe._ = {};
Oxe.location = {};
Oxe.events = { data: {} };
Oxe.modifiers = { data: {} };

Oxe.http = new Http();
Oxe.view = new View();
Oxe.model = new Model();
Oxe.loader = new Loader();
Oxe.router = new Router();
Oxe.batcher = new Batcher();
Oxe.component = new Component();

Oxe._ = {};
Oxe._.clicks = [];
Oxe._.inputs = [];
Oxe._.changes = [];
Oxe._.popstates = [];
Oxe._.observers = [];

Oxe.script = function () {
	return (document._currentScript || document.currentScript);
};

Oxe.document = function () {
	return (document._currentScript || document.currentScript).ownerDocument;
};

Oxe.element = function (name) {
	return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
};

Oxe.query = function (query) {
	return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
};

Oxe.setup = function (options) {
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

Oxe._.routerHandler = function (route) {
	if (route.title) document.title = route.title;
	if (route.url && !(route.component in this.cache)) {
		Oxe.loader.load(route.url.constructor === Object ? route.url : {
			url: route.url
		}, function () {
			Oxe.router.render(route);
		});
	} else {
		Oxe.router.render(route);
	}
};

Oxe._.viewHandler = function (addedNodes, removedNodes, parentNode) {
	var addedNode, removedNode, containerNode, i;

	i = addedNodes.length;
	while (i--) {
		addedNode = addedNodes[i];
		if (addedNode.nodeType === 1 && !addedNode.inRouterCache) {
			if (addedNode.isRouterComponent) addedNode.inRouterCache = true;
			containerNode = addedNode.uid || Utility.getContainer(parentNode);
			Oxe.view.add(addedNode, containerNode);
		}
	}

	i = removedNodes.length;
	while (i--) {
		removedNode = removedNodes[i];
		if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {
			if (removedNode.isRouterComponent) removedNode.inRouterCache = true;
			containerNode = removedNode.uid || Utility.getContainer(parentNode);
			Oxe.view.remove(removedNode, containerNode);
		}
	}

};

Oxe._.modelHandler = function (data, path) {
	var paths = path.split('.');
	var uid = paths[0];
	var pattern = paths.slice(1).join('.');
	var type = data === undefined ? 'unrender' : 'render';
	Oxe.view.eachBinder(uid, pattern, function (binder) {
		binder[type]();
	});
};

Oxe._.input = Oxe.container.addEventListener('input', function (e) {
	Oxe._.inputs.forEach(function (_input) {
		_input(e);
	});
}, true);

Oxe._.change = Oxe.container.addEventListener('change', function (e) {
	Oxe._.changes.forEach(function (_change) {
		_change(e);
	});
}, true);

Oxe._.click = Oxe.container.addEventListener('click', function (e) {
	Oxe._.clicks.forEach(function (_click) {
		_click(e);
	});
}, true);

Oxe._.popstate = window.addEventListener('popstate', function (e) {
	Oxe._.popstates.forEach(function (_popstate) {
		_popstate(e);
	});
}, true);

Oxe._.observer = new window.MutationObserver(function (mutations) {
	Oxe._.observers.forEach(function (_observer) {
		_observer(mutations);
	});
}).observe(Oxe.container, {
	childList: true,
	subtree: true
});

Oxe.component.setup({
	view: Oxe.view,
	model: Oxe.model,
	events: Oxe.events,
	modifiers: Oxe.modifiers
});

Oxe.view.setup({
	handler: Oxe._.viewHandler
});

Oxe.model.setup({
	handler: Oxe._.modelHandler
});

Oxe.view.run();
Oxe.model.run();

window.requestAnimationFrame(function () {
	var eStyle = document.createElement('style');
	var sStyle = document.createTextNode('o-view, o-view > :first-child { display: block; }');
	eStyle.setAttribute('title', 'Oxe');
	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(sStyle);
	document.head.insertBefore(eStyle, Oxe.currentScript);
	document.registerElement('o-view', { prototype: Object.create(HTMLElement.prototype) });
	var eIndex = Oxe.currentScript.getAttribute('o-index');
	if (eIndex) Oxe.loader.load({ url: eIndex });
});

export default Oxe;
