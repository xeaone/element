
function Router (options) {
	var self = this;

	options = options || {};

	self.cache = {};
	self.state = {};
	self.origin = window.location.origin;

	self.external = options.external;
	self.routes = options.routes || [];
	self.view = options.view || 'j-view';

	self.hash = !options.hash ? false : options.hash;
	self.contain = !options.contain ? false : options.contain;

	self.base = options.base || '';

	Object.defineProperty(this, 'root', {
		enumerable: true,
		get: function () {
			return this.hash ? '/#/' : '/';
		}
	});

}

Router.prototype._popstate = function (e) {
	this.navigate(e.state || window.location.href, true);
};

Router.prototype._click = function (e) {
	var self = this;

	if (e.metaKey || e.ctrlKey || e.shiftKey) return;

	// ensure target is anchor tag use shadow dom if available
	var target = e.path ? e.path[0] : e.target;
	while (target && 'A' !== target.nodeName) target = target.parentNode;

	if (!target || 'A' !== target.nodeName) return;

	var href = target.getAttribute('href');

	// if external is true then default action
	if (self.external) {
		if (self.external.constructor.name === 'Function' && self.external(href)) return;
		else if (self.external.constructor.name === 'RegExp' && self.external.test(href)) return;
		else if (self.external.constructor.name === 'String' && new RegExp(self.external).test(href)) return;
	}

	// check non acceptable attributes
	if (target.hasAttribute('download') || target.hasAttribute('external')) return;

	// check non acceptable href
	if (href.indexOf('mailto:') !== -1) return;
	if (href.indexOf('tel:') !== -1) return;
	if (href.indexOf('file:') !== -1) return;
	if (href.indexOf('ftp:') !== -1) return;

	e.preventDefault();
	self.navigate(href);
};

Router.prototype._loaded = function () {
	this.view = typeof this.view === 'string' ? document.querySelector(this.view) : this.view;

	(this.contain ? this.view : window).addEventListener('click', this._click.bind(this));
	window.addEventListener('popstate', this._popstate.bind(this));
	window.removeEventListener('DOMContentLoaded', this._loaded);

	this.navigate(window.location.href, true);
};

Router.prototype.listen = function (options) {

	if (options) {
		for (var key in options) {
			this[key] = options[key];
		}
	}

	if (document.readyState === 'complete' || document.readyState === 'loaded') {
		this._loaded();
	} else {
		window.addEventListener('DOMContentLoaded', this._loaded.bind(this), true);
	}

};

Router.prototype.normalize = function (path) {
	path = decodeURI(path).replace(/\/{2,}/g, '/')
	.replace(/(http(s)?:\/)/, '$1/')
	.replace(/\?.*/, '');

	return 	path = path === '' ? '/' : path;
};

Router.prototype.join = function () {
	return this.normalize(Array.prototype.join.call(arguments, '/'));
};

Router.prototype.scroll = function (x, y) {
	window.scroll(x, y);
};

Router.prototype.url = function (path) {
	var self = this;
	var url = {};

	url.base = self.base;
	url.root = self.root;
	url.origin = self.origin;

	url.path = path;

	if (url.path.indexOf(url.origin) === 0) {
		url.path = url.path.replace(url.origin, '');
	}

	if (url.path.indexOf(url.base) === 0) {
		url.path = url.path.replace(url.base, '');
	}

	if (url.path.indexOf(window.location.origin) === 0) {
		url.path = url.path.replace(window.location.origin, '');
	}

	if (url.path.indexOf(url.root) === 0) {
		url.path = url.path.replace(url.root, '/');
	}

	url.path = self.normalize(url.path);
	url.path = url.path[0] === '/' ? url.path : '/' + url.path;

	url.href = self.join(url.origin, url.base, url.root, url.path);

	return url;
};

Router.prototype.render = function (route) {
	var self = this;
	var component = self.cache[route.component];

	if (route.title) {
		document.title = route.title;
	}

	if (route.cache === true || route.cache === undefined) {

		component = self.cache[route.component];

		if (!component) {
			component = self.cache[route.component] = document.createElement(route.component);
		}

	} else {
		component = document.createElement(route.component);
	}

	window.requestAnimationFrame(function () {

		if (self.view.firstChild) {
			self.view.removeChild(self.view.firstChild);
		}

		self.view.appendChild(component);

	});

};

Router.prototype.redirect = function (path) {
	window.location.href = path;
};

Router.prototype.add = function (route) {
	var self = this;

	if (route.constructor.name === 'Object') {
		self.routes.push(route);
	} else if (route.constructor.name === 'Array') {
		self.routes = self.routes.concat(route);
	}

};

Router.prototype.remove = function (path) {
	var self = this;

	for (var i = 0, l = self.routes.length; i < l; i++) {

		if (path === self.routes[i].path) {
			return self.routes.splice(i, 1);
		}

	}

};

Router.prototype.get = function (path) {
	var self = this;

	for (var i = 0, l = self.routes.length; i < l; i++) {
		var route = self.routes[i];

		if (!route.path) {
			continue;
		} else if (route.path.constructor.name === 'String') {
			if (route.path === path) return route;
		} else if (route.path.constructor.name === 'RegExp') {
			if (route.path.test(path)) return route;
		} else if (route.path.constructor.name === 'Function') {
			if (route.path(path)) return route;
		}

	}

};

Router.prototype.navigate = function (data, replace) {
	var self = this;

	if (typeof data === 'string') {
		self.state.url = self.url(data);
		self.state.route = self.get(self.state.url.path);
		self.state.title = self.state.route.title || '';
	} else {
		self.state = data;
	}

	window.history[replace ? 'replaceState' : 'pushState'](self.state, self.state.route.title, self.state.url.href);

	if (self.state.route.redirect) {
		self.redirect(self.state.route);
	} else {
		self.render(self.state.route);
	}

	if (!replace) {
		self.scroll(0, 0);
	}

};

module.exports = Router;
