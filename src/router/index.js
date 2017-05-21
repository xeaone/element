
function Router (options) {
	var self = this;

	self.external = options.external;
	self.routes = options.routes || [];
	self.hash = options.hash === null || options.hash === undefined ? false : options.hash;

	self.cache = {};
	self.state = {};
	self.base = options.base;
	self.origin = window.location.origin;
	self.root = options.root || '' + (self.hash ? '/#/' : '/');

	self.loaded = function () {

		if (!self.base) {
			self.base = document.querySelector('base');
			self.base = self.base ? self.base.getAttribute('href') : '/';
			self.base = self.base === '' ? '/' : self.base;
			self.base = self.base[self.base.length-1] === '/' ? self.base.slice(0, -1) : self.base;
		}

		self.view = document.querySelector('j-view') || document.querySelector('[j-view]');
		self.navigate(window.location.href, true);
		window.removeEventListener('DOMContentLoaded', self.loaded);

	};

	self.popstate = function (e) {
		self.navigate(e.state || window.location.href, true);
	};

	self.click = function (e) {
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

	window.addEventListener('DOMContentLoaded', self.loaded, true);
	window.addEventListener('popstate', self.popstate, true);
	window.addEventListener('click', self.click, true);

	return self;
}

Router.prototype.scroll = function (x, y) {
	window.scroll(x, y);
	return this;
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

Router.prototype.url = function (path) {
	var url = {};

	url.root = this.root;
	url.origin = this.origin;

	url.base = this.normalize(this.base);

	url.path = path;
	url.path = url.path.indexOf(url.origin) === 0 ? url.path.replace(url.origin, '') : url.path;
	url.path = url.base !== '/' ? url.path.replace(url.base, '') : url.path;
	url.path = url.path.indexOf(url.root) === 0 ? url.path.replace(url.root, '/') : url.path;
	url.path = this.normalize(url.path);
	url.path = url.path[0] === '/' ? url.path : '/' + url.path;

	url.href = this.join(url.origin, url.base, url.root, url.path);

	return url;
};

Router.prototype.render = function (route) {
	var component = this.cache[route.component];

	if (route.title) {
		document.title = route.title;
	}

	if (route.cache === true || route.cache === undefined) {

		component = this.cache[route.component];

		if (!component) {
			component = this.cache[route.component] = document.createElement(route.component);
		}

	} else {
		component = document.createElement(route.component);
	}

	if (this.view.firstChild) {
		this.view.removeChild(this.view.firstChild);
	}

	this.view.appendChild(component);

	return this;
};

Router.prototype.add = function (route) {

	if (route.constructor.name === 'Object') {
		this.routes.push(route);
	} else if (route.constructor.name === 'Array') {
		this.routes = this.routes.concat(route);
	}

	return this;
};

Router.prototype.remove = function (path) {

	for (var i = 0, l = this.routes.length; i < l; i++) {

		if (path === this.routes[i].path) {
			this.routes.splice(i, 1);
			break;
		}

	}

	return this;
};

Router.prototype.redirect = function (path) {
	window.location.href = path;
	return this;
};

Router.prototype.get = function (path) {

	for (var i = 0, l = this.routes.length; i < l; i++) {
		var route = this.routes[i];

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

	if (typeof data === 'string') {
		this.state.url = this.url(data);
		this.state.route = this.get(this.state.url.path);
		this.state.title = this.state.route.title;
	} else {
		this.state = data;
	}

	window.history[replace ? 'replaceState' : 'pushState'](this.state, this.state.route.title, this.state.url.href);

	if (this.state.route.redirect) {
		this.redirect(this.state.route);
	} else {
		this.render(this.state.route);
	}

	if (!replace) {
		this.scroll(0, 0);
	}

	return this;
};

module.exports = Router;
