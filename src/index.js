import Component from './component';
import Utility from './utility';
import Batcher from './batcher';
import Router from './router';
import Loader from './loader';
import Model from './model';
import View from './view';
import Http from './http';
import Auth from './auth';

var Oxe = {};

Oxe.win = window;
Oxe.doc = document;
Oxe.body = document.body;
Oxe.head = document.head;
Oxe.currentScript = (document._currentScript || document.currentScript);

Oxe.global = {};
Oxe.location = {};
Oxe.events = { data: {} };
Oxe.modifiers = { data: {} };
Oxe.oView = document.body.querySelector('o-view');

Oxe.auth = new Auth();
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
	if (this.isSetup) return;
	else this.isSetup = true;

	options = (typeof options === 'function' ? options.call(Oxe) : options) || {};

	if (options.auth) {
		Oxe.auth.setup(options.auth);
	}

	if (options.http) {
		Oxe.http.setup(options.http);
	}

	if (options.loader) {
		Oxe.loader.setup(options.loader);
		Oxe.loader.run();
	}

	if (options.router) {
		Oxe._.clicks.push(Oxe.router.click.bind(Oxe.router));
		Oxe._.popstates.push(Oxe.router.popstate.bind(Oxe.router));
		options.router.loader = Oxe.loader;
		options.router.batcher = Oxe.batcher;
		Oxe.router.setup(options.router);
		Oxe.router.run();
	}

	return this;
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

Oxe._.input = Oxe.win.addEventListener('input', function (e) {
	Oxe._.inputs.forEach(function (input) {
		input(e);
	});
}, true);

Oxe._.change = Oxe.win.addEventListener('change', function (e) {
	Oxe._.changes.forEach(function (change) {
		change(e);
	});
}, true);

Oxe._.click = Oxe.win.addEventListener('click', function (e) {
	Oxe._.clicks.forEach(function (click) {
		click(e);
	});
}, true);

Oxe._.popstate = Oxe.win.addEventListener('popstate', function (e) {
	Oxe._.popstates.forEach(function (popstate) {
		popstate(e);
	});
}, true);

Oxe._.observer = new window.MutationObserver(function (mutations) {
	Oxe._.observers.forEach(function (observer) {
		observer(mutations);
	});
}).observe(Oxe.body, {
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
	var eStyle = Oxe.doc.createElement('style');
	var sStyle = Oxe.doc.createTextNode('o-view, o-view > :first-child { display: block; }');
	eStyle.setAttribute('title', 'Oxe');
	eStyle.setAttribute('type', 'text/css');
	eStyle.appendChild(sStyle);
	Oxe.head.appendChild(eStyle);
	Oxe.doc.registerElement('o-view', { prototype: Object.create(HTMLElement.prototype) });
	var eIndex = Oxe.currentScript.getAttribute('o-index');
	if (eIndex) Oxe.loader.load({ url: eIndex });
});

export default Oxe;
