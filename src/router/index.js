var Utility = require('./utility');
var Render = require('./render');
var Request = require('./request');
var Response = require('./response');

var PUSH = 2;
var REPLACE = 3;
var MODE = 'history' in window && 'pushState' in window.history;

function Router (options) {
	this.name = options.name;

	this.base = options.base;
	this.routes = options.routes || [];
	this.redirects = options.redirects || [];
	this.query = options.query || '[r-view="'+ this.name +'"]';
	this.authorize = options.authorize || function () { return true; };

	this.isListening = false;
	this.permitChangeEvent = true;
	this.state = options.state || {};
	this.location = document.location;

	this.mode = options.mode === null || options.mode === undefined ? MODE : options.mode;
	this.root = options.root === null || options.root === undefined ? (this.mode ? '/' : '#/') : options.root;
}

Router.prototype.isSameOrigin = function (path) {
	return path && path.indexOf(document.location.origin) > -1;
};

Router.prototype.isSamePath = function (pathOne, pathTwo) {
	return Utility.clean(pathOne || '') === Utility.clean(pathTwo || '');
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

	var length = self.routes.length;
	var route = null;
	var index = 0;

	path = Utility.strip(path);

	for (index; index < length; index++) {
		route = self.routes[index];
		if (typeof route.path === 'string') {
			if (route.path === path || route.path === '/' + path) {
				return route;
			}
		} else if (route.path.test(path)) {
			return route;
		}
	}
};

Router.prototype.navigate = function (state, type) {
	var self = this;

	type = type === null || type === undefined ? PUSH : type;
	state = typeof state === 'string' ? { path: state } : state;

	var route = self.get(state.path);

	self.state.title = route && route.title ? route.title : state.title;
	self.state.path = self.mode ? self.root + Utility.clean(state.path) : self.root + Utility.clean(state.path);

	var data = {
		route: route,
		state: this.state,
		query: this.query,
		href: document.location.href,
		hash: Utility.getHash(this.href),
		search: Utility.getSearch(this.href),
		pathname: Utility.getPathname(this.href)
	};

	if (self.authorize(Request(data), Response(data)) === false) {
		Render({
			type: 'text',
			title: '401',
			text: '{"statusCode":401,"error":"Missing Authentication"}'
		});

		return self;
	}

	if (self.mode) {
		if (type === PUSH) window.history.pushState(self.state, self.state.title, self.state.path);
		if (type === REPLACE) window.history.replaceState(self.state, self.state.title, self.state.path);
	} else {
		self.permitChangeEvent = false;
		window.location.hash = self.state.path;
	}

	if (route) {
		route.handler(Request(data), Response(data));
	} else {
		Render({
			type: 'text',
			title: '404',
			text: '{"statusCode":404,"error":"Not Found"}'
		});
	}

	return self;
};

Router.prototype.listen = function () {
	var self = this;

	if (self.isListening) return self;
	else self.isListening = true;

	window.addEventListener('DOMContentLoaded', function () {
		var state = { title: document.title, path: document.location.href };
		self.navigate(state, REPLACE);
	}, false);

	window.addEventListener(self.mode ? 'popstate' : 'hashchange', function (e) {
		if (self.permitChangeEvent) {
			var state = {};

			if (self.mode) state = e.state || {};
			else state = { path: e.newURL };

			self.navigate(state);
		} else {
			self.permitChangeEvent = true;
		}
	}, false);

	window.addEventListener('click', function (e) {
		if (e.metaKey || e.ctrlKey || e.shiftKey) return;

		// ensure target is anchor tag use shadow dom if available
		var target = e.path ? e.path[0] : e.target;
		while (target && 'A' !== target.nodeName) target = target.parentNode;
		if (!target || 'A' !== target.nodeName) return;

		// check non acceptable attributes
		if (target.hasAttribute('r-ignore') || target.hasAttribute('download') || target.getAttribute('rel') === 'external') return;

		var state = {
			path: target.href || '',
			title: target.title || ''
		};

		// if base and base not equal the url then ignore
		if (self.base && Utility.getPathname(state.path).indexOf(self.base) !== 0) return;

		// check non acceptable href
		if (Utility.has(state.path, 'mailto:')) return;
		if (Utility.has(state.path, 'tel:')) return;
		if (Utility.has(state.path, 'file:')) return;
		if (Utility.has(state.path, 'ftp:')) return;

		// check non acceptable origin
		if (!self.isSameOrigin(state.path)) return;

		e.preventDefault();

		// check for same path
		if (self.isSamePath(state.path, self.state.path)) return;

		self.navigate(state, PUSH);
	}, false);

	return self;
};

module.exports = {
	PUSH: PUSH,
	REPLACE: REPLACE,

	routers: {},
	redirect: function (path) {
		window.location = path;
	},
	router: function (options) {
		if (!options.name) throw new Error('Router - name parameter required');
		if (this.routers[options.name]) throw new Error('Router - name ' + options.name + ' exists');
		this.routers[options.name] = new Router(options);
		return this.routers[options.name];
	}
};
