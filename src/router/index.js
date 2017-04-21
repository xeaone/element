var Utility = require('./utility');
var Render = require('./render');
var Path = require('./path');

module.exports = {
	render: Render,
	path: Path,
	setup: function (options) {
		var self = this;

		self.components = {};
		self.routes = options.routes || [];
		self.redirects = options.redirects || [];

		self.mode = options.mode;
		self.mode = self.mode === null || self.mode === undefined ? true : self.mode;
		self.mode = 'history' in window && 'pushState' in window.history ? self.mode : false;

		self.ready = 0;
		self.isChangeEvent = true;
		self.base = options.base || '';
		self.external = options.external || '';
		self.root = options.root || (self.mode ? '/' : '/#');
		self.state = { root: self.root, base: self.base, origin: self.path.normalize(self.base + self.root) };

		function init () {
			self.view = document.querySelector('j-view') || document.querySelector('[j-view]');
			self.navigate({ path: window.location.href }, true);
		}

		window.addEventListener('DOMContentLoaded', function () {
			self.ready++;
			if (self.ready === 2) init();
		}, false);

		window.addEventListener('WebComponentsReady', function() {
			self.ready++;
			if (self.ready === 2) init();
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

			// if external not equal the url then ignore
			if (self.external && self.path.path(target.href, self.state.base, self.state.root).indexOf(self.external) !== 0) return;

			// check non acceptable attributes
			if (target.hasAttribute('download') || target.getAttribute('rel') === 'external') return;

			// check non acceptable href
			if (Utility.has(target.href, 'mailto:')) return;
			if (Utility.has(target.href, 'tel:')) return;
			if (Utility.has(target.href, 'file:')) return;
			if (Utility.has(target.href, 'ftp:')) return;

			// check non acceptable origin
			// if (!self.path.isSameOrigin(state.path)) return;

			e.preventDefault();
			// if (!self.path.isSamePath(target.href, self.state.path))
			self.navigate({ path: target.href });
		}, false);

		return self;
	},
	redirect: function (route) {
		var self = this;
		window.location = route.path;
		return self;
	},
	add: function (route) {
		var self = this;

		if (route.constructor.name === 'Object') {
			self.routes.push(route);
		} else if (route.constructor.name === 'Array') {
			self.routes = self.routes.concat(route);
		}

		return self;
	},
	remove: function (path) {
		var self = this;

		for (var i = 0, l = self.routes.length; i < l; i++) {
			var route = self.routes[i];

			if (path === route.path) {
				self.routes.splice(i, 1);
				break;
			}
		}

		return self;
	},
	get: function (path) {
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
	},
	change: function (state, replace) {
		var self = this;

		if (self.mode) {
			window.history[replace ? 'replaceState' : 'pushState'](state, state.title, state.origin + state.path);
		} else {
			self.isChangeEvent = false;
			window.location = state.origin + state.path;
		}

		return self;
	},
	navigate: function (state, replace) {
		var self = this;

		self.state.path = self.path.getPath(state.path, self.state.base, self.state.root);
		self.state.hash = self.path.getHash(self.state.path);
		self.state.search = self.path.getSearch(self.state.path);
		self.state.href = self.path.normalize(window.location.href);

		self.route = self.get(self.state.path);
		self.state.title = self.route.title;

		console.log(self.state);

		self.change(self.state, replace);

		if (self.route.redirect) {
			self.redirect(self.route);
		} else {
			self.render(self.route);
		}

		return self;
	}
};
