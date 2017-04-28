var Utility = require('./utility');

function Router () {}

Router.prototype.render = function (route) {
	var self = this;
	var component = null;

	if (route.title) document.title = route.title;

	if (typeof route.component === 'string') {
		if (route.component in self.cache) component = self.cache[route.component];
		else component = self.cache[route.component] = document.createElement(route.component);
	} else {
		component = route.component;
	}

	if (self.view.firstChild) self.view.removeChild(self.view.firstChild);
	self.view.appendChild(component);
	window.scroll(0, 0);
	return self;
};

Router.prototype.redirect = function (route) {
	var self = this;
	window.location = route.path;
	return self;
};

Router.prototype.add = function (route) {
	var self = this;

	if (route.constructor.name === 'Object') {
		self.routes.push(route);
	} else if (route.constructor.name === 'Array') {
		self.routes = self.routes.concat(route);
	}

	return self;
};

Router.prototype.remove = function (path) {
	var self = this;

	for (var i = 0, l = self.routes.length; i < l; i++) {
		var route = self.routes[i];

		if (path === route.path) {
			self.routes.splice(i, 1);
			break;
		}
	}

	return self;
};

Router.prototype.get = function (path) {
	var self = this;

	var index = 0;
	var route = null;
	var length = self.routes.length;

	for (index; index < length; index++) {
		route = self.routes[index];
		if (!route.path) {
			throw new Error('Router: missing path option');
		} else if (typeof route.path === 'string') {
			if (route.path === path || route.path === '/' + path) {
				return route;
			}
		} else if (typeof route.path === 'function') {
			if (route.path.test(path)) {
				return route;
			}
		}
	}

	route = {};
	route.title = '404';
	route.component = document.createElement('div');
	route.component.innerHTML = '{ "statusCode": 404, "error": "Not Found" }';

	return route;
};

Router.prototype.change = function (state, replace) {
	var self = this;

	if (self.mode) {
		window.history[replace ? 'replaceState' : 'pushState'](state, state.title, Utility.normalize(state.origin + state.path));
	} else {
		self.isChangeEvent = false;
		window.location = Utility.normalize(state.origin + state.path);
	}

	return self;
};

Router.prototype.navigate = function (state, replace) {
	var self = this;

	self.state.path = Utility.getPath(state.path, self.state.base, self.state.root);
	self.state.hash = Utility.getHash(self.state.path);
	self.state.search = Utility.getSearch(self.state.path);
	self.state.href = Utility.normalize(window.location.href);

	self.route = self.get(self.state.path);
	self.state.title = self.route.title;

	self.change(self.state, replace);

	if (self.route.redirect) {
		self.redirect(self.route);
	} else {
		self.render(self.route);
	}

	return self;
};

Router.prototype.create = function (options) {
	var self = this;

	self.mode = options.mode;
	self.mode = self.mode === null || self.mode === undefined ? true : self.mode;
	self.mode = 'history' in window && 'pushState' in window.history ? self.mode : false;

	self.base = options.base || '';
	self.routes = options.routes || [];
	self.external = options.external || '';

	self.cache = {};
	self.isChangeEvent = true;
	self.root = self.mode ? '/' : '/#';
	self.state = { root: self.root, base: self.base, origin: Utility.normalize(self.base + self.root) };

	window.addEventListener('DOMContentLoaded', function () {
		self.view = document.querySelector('j-view') || document.querySelector('[j-view]');
		self.navigate({ path: window.location.href }, true);
	}, false);

	window.addEventListener(self.mode ? 'popstate' : 'hashchange', function (e) {
		if (self.isChangeEvent) {
			var state = self.mode ? e.state : { path: e.newURL }; //&& e.state
			self.navigate(state, true);
		} else {
			self.isChangeEvent = true;
		}
	}, false);

	window.addEventListener('click', function (e) {
		if (e.metaKey || e.ctrlKey || e.shiftKey) return;

		// ensure target is anchor tag use shadow dom if available
		var target = e.path ? e.path[0] : e.target;
		while (target && 'A' !== target.nodeName) target = target.parentNode;
		if (!target || 'A' !== target.nodeName) return;

		// if external is true then default action
		if (self.external) {
			if (self.external.constructor.name === 'Function' && self.external(target.href)) return;
			else if (self.external.constructor.name === 'RegExp' && self.external.test(target.href)) return;
			else if (self.external.constructor.name === 'String' && new RegExp(self.external).test(target.href)) return;
		}

		// check non acceptable attributes
		if (target.hasAttribute('download') || target.getAttribute('rel') === 'external') return;

		// check non acceptable href
		if (Utility.has(target.href, 'mailto:')) return;
		if (Utility.has(target.href, 'tel:')) return;
		if (Utility.has(target.href, 'file:')) return;
		if (Utility.has(target.href, 'ftp:')) return;

		// check non acceptable origin
		// if (!Utility.isSameOrigin(state.path)) return;

		e.preventDefault();
		// if (!Utility.isSamePath(target.href, self.state.path))
		self.navigate({ path: target.href });
	}, false);

	return self;
};

module.exports = function (options) {
	return new Router().create(options);
};
