import Events from './events';

export default function Router (options) {
	Events.call(this);

	options = options || {};

	this.state = {};
	this.cache = {};
	this.origin = window.location.origin;

	this.external = options.external;
	this.routes = options.routes || [];
	this.view = options.view || 'j-view';

	this.hash = !options.hash ? false : options.hash;
	this.contain = !options.contain ? false : options.contain;

	this.base = options.base || '';

	Object.defineProperty(this, 'root', {
		enumerable: true,
		get: function () {
			return this.hash ? '/#/' : '/';
		}
	});

}

Router.prototype = Object.create(Events.prototype);
Router.prototype.constructor = Router;

Router.prototype.popstate = function (e) {
	this.navigate(e.state || window.location.href, true);
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
	if (self.external && (
		self.external.constructor.name === 'Function' && self.external(href) ||
		self.external.constructor.name === 'RegExp' && self.external.test(href) ||
		self.external.constructor.name === 'String' && new RegExp(self.external).test(href)
	)) return;

	// check non acceptable attributes and href
	if (target.hasAttribute('download') ||
		target.hasAttribute('external') ||
		href.indexOf('mailto:') !== -1 ||
		href.indexOf('file:') !== -1 ||
		href.indexOf('tel:') !== -1 ||
		href.indexOf('ftp:') !== -1
	) return;

	e.preventDefault();
	self.navigate(href);
};

Router.prototype.start = function () {
	this.view = typeof this.view === 'string' ? document.querySelector(this.view) : this.view;

	(this.contain ? this.view : window).addEventListener('click', this.click.bind(this));
	window.addEventListener('popstate', this.popstate.bind(this));
	this.navigate(window.location.href, true);

};

Router.prototype.normalize = function (path) {
	path = decodeURI(path)
		.replace(/\/{2,}/g, '/')
		.replace(/(http(s)?:\/)/, '$1/')
		.replace(/\?.*?$/, '');

	if (!this.hash) {
		path = path.replace(/#.*?$/, '');
	}

	return 	path = path === '' ? '/' : path;
};

Router.prototype.parse = function (path) {
	return new RegExp('^'+ path
		.replace(/{\*}/g, '(?:.*)')
		.replace(/{(\w+)}/g, '([^\/]+)')
		+ '(\/)?$'
	);
};

Router.prototype.parameters = function (routePath, userPath) {
	var name;
	var parameters = {};
	var brackets = /{|}/g;
	var pattern = /{(\w+)}/;
	var userPaths = userPath.split('/');
	var routePaths = routePath.split('/');

	routePaths.forEach(function (path, index) {
		if (pattern.test(path)) {
			name = path.replace(brackets, '');
			parameters[name] = userPaths[index];
		}
	});

	return parameters;
};

Router.prototype.join = function () {
	return this.normalize(Array.prototype.join.call(arguments, '/'));
};

Router.prototype.scroll = function (x, y) {
	window.scroll(x, y);
};

Router.prototype.url = function (path) {
	var url = {};

	url.path = path;
	url.base = this.base;
	url.root = this.root;
	url.origin = this.origin;

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

	if (url.path[0] !== '/') {
		url.path = this.join(window.location.pathname.replace(this.base, ''), url.path);
	}

	url.path = this.join(url.path, '/');
	url.href = this.join(url.origin, url.base, url.root, url.path);

	return url;
};

Router.prototype.appendComponentElement = function (url, callback) {
	var element;

	if (/\.html$/.test(url)) {
		element = document.createElement('link');
		element.setAttribute('href', url);
		element.setAttribute('rel', 'import');
	} else if (/\.js$/.test(url)) {
		element = document.createElement('script');
		element.setAttribute('src', url);
		element.setAttribute('type', 'text/javascript');
	} else {
		throw new Error('Invalid extension type');
	}

	element.onload = callback;
	element.setAttribute('async', '');
	document.head.appendChild(element);
};

Router.prototype.render = function (route, callback) {
	var self = this;

	if (route.title) {
		document.title = route.title;
	}

	var appendView = function () {

		if (self.view.firstChild) {
			self.view.removeChild(self.view.firstChild);
		}

		if (!self.cache[route.component]) {
			self.cache[route.component] = document.createElement(route.component);
		}

		self.view.appendChild(self.cache[route.component]);

		if (callback) return callback();
	};

	if (route.componentUrl && !self.cache[route.component]) {
		self.appendComponentElement(route.componentUrl, appendView);
	} else {
		appendView();
	}

};

Router.prototype.redirect = function (path, callback) {
	window.location.href = path;
	return callback();
};

Router.prototype.add = function (route) {
	if (route.constructor.name === 'Object') {
		this.routes.push(route);
	} else if (route.constructor.name === 'Array') {
		this.routes = this.routes.concat(route);
	}
};

Router.prototype.remove = function (path) {
	for (var i = 0, l = this.routes.length; i < l; i++) {
		if (path === this.routes[i].path) {
			return this.routes.splice(i, 1);
		}
	}
};

Router.prototype.get = function (path) {
	for (var i = 0, l = this.routes.length, route; i < l; i++) {
		route = this.routes[i];

		if (route.path.constructor.name === 'String') {
			if (this.parse(route.path).test(path)) {
				route.parameters = this.parameters(route.path, path);
				return route;
			}
		} else if (route.path.constructor.name === 'RegExp') {
			if (route.path.test(path)) {
				return route;
			}
		} else if (route.path.constructor.name === 'Function') {
			if (route.path(path)){
				return route;
			}
		}

	}
};

Router.prototype.findRoute = function (path) {
	return this.routes.find(function (route) {
		if (route.path.constructor.name === 'String') {
			return this.parse(route.path).test(path);
		} else if (route.path.constructor.name === 'RegExp') {
			return route.path.test(path);
		} else if (route.path.constructor.name === 'Function') {
			return route.path(path);
		}
	});
};

Router.prototype.findRoutes = function (pattern) {
	return this.routes.filter(function (route) {
		return pattern.test(route.path);
	}, this);
};

Router.prototype.navigate = function (data, replace) {
	var self = this;

	if (typeof data === 'string') {
		self.state.url = self.url(data);
		self.state.route = self.get(self.state.url.path) || {};
		self.state.parameters = self.state.route.parameters || {};
		self.state.title = self.state.route.title || '';
	} else {
		self.state = data;
	}

	window.history[replace ? 'replaceState' : 'pushState'](self.state, self.state.route.title, self.state.url.href);

	if (self.state.route.redirect) {
		self.redirect(self.state.route, function () {
			if (!replace) self.scroll(0, 0);
			self.emit('navigated');
		});
	} else {
		self.render(self.state.route, function () {
			if (!replace) self.scroll(0, 0);
			self.emit('navigated');
		});
	}

};
