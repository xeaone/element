import Utility from './utility';
import Events from './events';
import INDEX from './index';

export default function Router (options) {
	Events.call(this);
	this.state = {};
	this.cache = {};
	this.location = {};
	this.isRan = false;
	this.setup(options);
}

Router.prototype = Object.create(Events.prototype);
Router.prototype.constructor = Router;

Router.prototype.setup = function (options) {
	options = options || {};
	this.handler = options.handler;
	this.external = options.external;
	this.routes = options.routes || [];
	this.view = options.view || 'j-view';
	this.base = this.createBase(options.base);
	this.container = options.container || document.body;
	this.hash = options.hash === undefined ? false : options.hash;
	this.trailing = options.trailing === undefined ? false : options.trailing;
	return this;
};

Router.prototype.createBase = function (base) {
	base = base || '';

	if (base) {
		var element = document.head.querySelector('base');

		if (!element) {
			element = document.createElement('base');
			document.head.insertBefore(element, document.head.firstChild);
		}

		if (typeof base === 'string') {
			element.href = base;
		}

		base = element.href;
	}

	return base;
};

Router.prototype.testPath = function (routePath, userPath) {
	return new RegExp(
		'^' + routePath
		.replace(/{\*}/g, '(?:.*)')
		.replace(/{(\w+)}/g, '([^\/]+)')
		+ '(\/)?$'
	).test(userPath);
};

Router.prototype.scroll = function (x, y) {
	window.scroll(x, y);
};

Router.prototype.back = function () {
	window.history.back();
};

Router.prototype.redirect = function (path) {
	window.location.href = path;
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
			this.routes.splice(i, 1);
		}
	}
};

Router.prototype.get = function (path) {
	for (var i = 0, l = this.routes.length; i < l; i++) {
		var route = this.routes[i];
		if (path === route.path) {
			return route;
		}
	}
};

Router.prototype.find = function (path) {
	for (var i = 0, l = this.routes.length; i < l; i++) {
		var route = this.routes[i];
		if (this.testPath(route.path, path)) {
			return route;
		}
	}
};

Router.prototype.toParameterObject = function (routePath, userPath) {
	var parameters = {};
	var brackets = /{|}/g;
	var pattern = /{(\w+)}/;
	var userPaths = userPath.split('/');
	var routePaths = routePath.split('/');

	for (var i = 0, l = routePaths.length; i < l; i++) {
		if (pattern.test(routePaths[i])) {
			var name = routePaths[i].replace(brackets, '');
			parameters[name] = userPaths[i];
		}
	}

	return parameters;
};

Router.prototype.toQueryString = function (data) {
	if (!data) return;

	var query = '?';

	for (var key in data) {
		query += key + '=' + data[key] + '&';
	}

	return query.slice(-1); // remove trailing &
};


Router.prototype.toQueryObject = function (path) {
	if (!path) return;

	var result = {};
	var queries = path.slice(1).split('&');

	for (var i = 0, l = queries.length; i < l; i++) {
		var query = queries[i].split('=');
		result[query[0]] = query[1];
	}

	return result;
};

Router.prototype.getLocation = function (path) {
	var location = {};

	location.pathname = decodeURI(path);
	location.origin = window.location.origin;
	location.base = this.base ? this.base : location.origin;

	if (location.base.slice(-3) === '/#/') {
		location.base = location.base.slice(0, -3);
	}

	if (location.base.slice(-2) === '/#') {
		location.base = location.base.slice(0, -2);
	}

	if (location.base.slice(-1) === '/') {
		location.base = location.base.slice(0, -1);
	}

	if (location.pathname.indexOf(location.base) === 0) {
		location.pathname = location.pathname.slice(location.base.length);
	}

	if (location.pathname.indexOf(location.origin) === 0) {
		location.pathname = location.pathname.slice(location.origin.length);
	}

	if (location.pathname.indexOf('/#/') === 0) {
		location.pathname = location.pathname.slice(2);
	}

	if (location.pathname.indexOf('#/') === 0) {
		location.pathname = location.pathname.slice(1);
	}

	var hashIndex = this.hash ? location.pathname.indexOf('#', location.pathname.indexOf('#')) : location.pathname.indexOf('#');
	if (hashIndex !== -1) {
		location.hash = location.pathname.slice(hashIndex);
		location.pathname = location.pathname.slice(0, hashIndex);
	} else {
		location.hash = '';
	}

	var searchIndex = location.pathname.indexOf('?');
	if (searchIndex !== -1) {
		location.search = location.pathname.slice(searchIndex);
		location.pathname = location.pathname.slice(0, searchIndex);
	} else {
		location.search = '';
	}

	if (this.trailing) {
		location.pathname = this.join(location.pathname, '/');
	} else {
		location.pathname = location.pathname.replace(/\/$/, '');
	}

	if (location.pathname.charAt(0) !== '/') {
		location.pathname = '/' + location.pathname;
	}

	if (this.hash) {
		location.href = Utility.joinSlash(location.base, '/#/', location.pathname);
	} else {
		location.href =  Utility.joinSlash(location.base, '/', location.pathname);
	}

	location.href += location.search;
	location.href += location.hash;

	return location;
};

Router.prototype.render = function (route) {
	var self = this, child, component;

	component = self.cache[route.component];
	if (!component) {
		component = self.cache[route.component] = document.createElement(route.component);
		component.inRouterCache = false;
		component.isRouterComponent = true;
	}

	INDEX.batcher.write(function () {
		while (child = self.view.firstChild) self.view.removeChild(child);
		self.view.appendChild(component);
		self.scroll(0, 0);
		self.emit('navigated');
	});
};

Router.prototype.navigate = function (data, replace) {

	if (typeof data === 'string') {
		this.state.location = this.getLocation(data);
		this.state.route = this.find(this.state.location.pathname) || {};
		this.state.query = this.toQueryObject(this.state.location.search) || {};
		this.state.parameters = this.toParameterObject(this.state.route.path || '', this.state.location.pathname) || {};
		this.state.title = this.state.route.title || '';
		this.location = this.state.location;
	} else {
		this.state = data;
	}

	window.history[replace ? 'replaceState' : 'pushState'](this.state, this.state.title, this.state.location.href);

	if (this.state.route.handler) {
		this.state.route.handler(this.state.route);
	} else if (this.state.route.redirect) {
		this.redirect(this.state.route.redirect);
	} else {
		if (this.handler) {
			this.handler(this.state.route);
		}
	}

};

Router.prototype.popstate = function (e) {
	this.navigate(e.state || window.location.href, true);
};

Router.prototype.click = function (e) {
	// TODO might need to filter for container
	var self = this;

	if (e.metaKey || e.ctrlKey || e.shiftKey) return;

	// ensure target is anchor tag use shadow dom if available
	var target = e.path ? e.path[0] : e.target;
	while (target && 'A' !== target.nodeName) target = target.parentNode;
	if (!target || 'A' !== target.nodeName) return;

	// if external is true then default action
	if (self.external && (
		self.external.constructor.name === 'RegExp' && self.external.test(target.href) ||
		self.external.constructor.name === 'Function' && self.external(target.href) ||
		self.external.constructor.name === 'String' && self.external === target.href
	)) return;

	// check non acceptable attributes and href
	if (target.hasAttribute('download') ||
		target.hasAttribute('external') ||
		target.hasAttribute('j-external') ||
		// target.hasAttribute('target') ||
		target.href.indexOf('mailto:') !== -1 ||
		target.href.indexOf('file:') !== -1 ||
		target.href.indexOf('tel:') !== -1 ||
		target.href.indexOf('ftp:') !== -1
	) return;

	e.preventDefault();
	if (this.state.location.href === target.href) return;
	self.navigate(target.href);
};

Router.prototype.run = function () {
	if (this.isRan) return;
	else this.isRan = true;

	this.view = this.container.querySelector(this.view);
	if (!this.view) throw new Error('Router requires j-view element');
	// this.container.addEventListener('click', this.click.bind(this));
	INDEX._.clicks.push(this.click.bind(this));
	INDEX._.popstates.push(this.popstate.bind(this));

	this.navigate(window.location.href, true);
};
