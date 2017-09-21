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
	// var eIndex = eScript.getAttribute('j-index');
	var eStyle = document.createElement('style');
	var sStyle = document.createTextNode('j-view, j-view > :first-child { display: block; }');
	// if (eIndex) Globals.loader.load({ url: eIndex });
	eStyle.setAttribute('title', 'Jenie');
	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(sStyle);
	document.head.insertBefore(eStyle, eScript);
	document.registerElement('j-view', { prototype: Object.create(HTMLElement.prototype) });
});

// TODO add auth handler
var Globals = {};

Globals.container = document.body;

Globals.globals = {};
Globals.location = {};
Globals.events = { data: {} };
Globals.modifiers = { data: {} };

Globals.http = new Http();
Globals.view = new View();
Globals.model = new Model();
Globals.loader = new Loader();
Globals.router = new Router();
Globals.batcher = new Batcher();
Globals.component = new Component();

Globals._ = {};
Globals._.clicks = [];
Globals._.inputs = [];
Globals._.changes = [];
Globals._.popstates = [];
Globals._.observers = [];

Globals.script = function () {
	return (document._currentScript || document.currentScript);
};

Globals.document = function () {
	return (document._currentScript || document.currentScript).ownerDocument;
};

Globals.element = function (name) {
	return (document._currentScript || document.currentScript).ownerDocument.createElement(name);
};

Globals.query = function (query) {
	return (document._currentScript || document.currentScript).ownerDocument.querySelector(query);
};

Globals.setup = function (options) {
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

Globals._.routerHandler = function (route) {
	if (route.title) document.title = route.title;
	if (route.url && !(route.component in this.cache)) {
		Globals.loader.load(route.url.constructor === Object ? route.url : {
			url: route.url
		}, function () {
			Globals.router.render(route);
		});
	} else {
		Globals.router.render(route);
	}
};

Globals._.viewHandler = function (addedNodes, removedNodes, parentNode) {
	var addedNode, removedNode, containerNode, i;

	i = addedNodes.length;
	while (i--) {
		addedNode = addedNodes[i];
		if (addedNode.nodeType === 1 && !addedNode.inRouterCache) {
			if (addedNode.isRouterComponent) addedNode.inRouterCache = true;
			containerNode = addedNode.uid || Utility.getContainer(parentNode);
			Globals.view.add(addedNode, containerNode);
		}
	}

	i = removedNodes.length;
	while (i--) {
		removedNode = removedNodes[i];
		if (removedNode.nodeType === 1 && !removedNode.inRouterCache) {
			if (removedNode.isRouterComponent) removedNode.inRouterCache = true;
			containerNode = removedNode.uid || Utility.getContainer(parentNode);
			Globals.view.remove(removedNode, containerNode);
		}
	}

};

Globals._.modelHandler = function (data, path) {
	var paths = path.split('.');
	var uid = paths[0];
	var pattern = paths.slice(1).join('.');
	var type = data === undefined ? 'unrender' : 'render';
	Globals.view.eachBinder(uid, pattern, function (binder) {
		binder[type]();
	});
};

Globals._.input = Globals.container.addEventListener('input', function (e) {
	Globals._.inputs.forEach(function (_input) {
		_input(e);
	});
}, true);

Globals._.change = Globals.container.addEventListener('change', function (e) {
	Globals._.changes.forEach(function (_change) {
		_change(e);
	});
}, true);

Globals._.click = Globals.container.addEventListener('click', function (e) {
	Globals._.clicks.forEach(function (_click) {
		_click(e);
	});
}, true);

Globals._.popstate = Globals.container.addEventListener('popstate', function (e) {
	Globals._.popstates.forEach(function (_popstate) {
		_popstate(e);
	});
}, true);

Globals._.observer = new window.MutationObserver(function (mutations) {
	Globals._.observers.forEach(function (_observer) {
		_observer(mutations);
	});
}).observe(Globals.container, {
	childList: true,
	subtree: true
});

Globals.component.setup({
	view: Globals.view,
	model: Globals.model,
	events: Globals.events,
	modifiers: Globals.modifiers
});

Globals.view.setup({
	handler: Globals._.viewHandler
});

Globals.model.setup({
	handler: Globals._.modelHandler
});

Globals.view.run();
Globals.model.run();

export default Globals;
