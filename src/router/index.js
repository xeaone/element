
function Router (options) {
	var self = this;

	self.external = options.external;
	self.routes = options.routes || [];
	self.hash = options.hash === null || options.hash === undefined ? false : options.hash;

	self.cache = {};
	self.state = {};
	self.base = options.base || '';
	self.origin = window.location.origin;
	self.root = options.root || '' + (self.hash ? '/#/' : '/');
	self.view = document.querySelector('j-view');

	window.addEventListener('DOMContentLoaded', self.loaded.bind(self), true);
	window.addEventListener('popstate', self.popstate.bind(self), true);

}

Router.prototype.loaded = function () {
	var self = this;

	// if (self.base) {
	// 	var base = document.querySelector('base');
	//
	// 	if (!base) {
	// 		base = document.createElement('base');
	// 		document.head.appendChild(base);
	// 	}
	//
	// 	base.href = self.base;
	// }

	self.view = document.querySelector('j-view') || document.querySelector('[j-view]');

	self.navigate(window.location.href, true);
	self.view.addEventListener('click', self.click.bind(self), true);

	window.removeEventListener('DOMContentLoaded', self.loaded);

};

Router.prototype.popstate = function (e) {
	var self = this;
	self.navigate(e.state || window.location.href, true);
};

Router.prototype.click = function (e) {
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

Router.prototype.redirect = function (path) {
	window.location.href = path;
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
		self.state.title = self.state.route.title;
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
