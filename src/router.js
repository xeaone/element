import Events from './lib/events';
import Global from './global';

var Router = function () {
	Events.call(this);

	this.data = [];
	this.location = {};

	this.ran = false;
	this.auth = false;
	this.hash = false;
	this.trailing = false;

	this.element = null;
	this.container = null;
	this.compiled = false;

	document.addEventListener('click', this.clickListener.bind(this), true);
	window.addEventListener('popstate', this.stateListener.bind(this), true);
};

Router.prototype = Object.create(Events.prototype);
Router.prototype.constructor = Router;

Router.prototype.setup = function (options) {
	options = options || {};

	this.auth = options.auth === undefined ? this.auth : options.auth;
	this.hash = options.hash === undefined ? this.hash : options.hash;
	this.element = options.element === undefined ? this.element : options.element;
	this.external = options.external === undefined ? this.external : options.external;
	this.trailing = options.trailing === undefined ? this.trailing : options.trailing;
	this.container = options.container === undefined ? this.container : options.container;

	if (options.routes) {
		this.data = this.data.concat(options.routes);
	}

	this.route(window.location.href, { replace: true });
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
	if (!route) {
		throw new Error('Oxe.router.add - requires route parameter');
	} else if (route.constructor.name === 'Object') {
		this.data.push(route);
	} else if (route.constructor.name === 'Array') {
		this.data = this.data.concat(route);
	}
};

Router.prototype.remove = function (path) {
	for (var i = 0, l = this.data.length; i < l; i++) {
		if (path === this.data[i].path) {
			this.data.splice(i, 1);
		}
	}
};

Router.prototype.get = function (path) {
	for (var i = 0, l = this.data.length; i < l; i++) {
		var route = this.data[i];
		if (path === route.path) {
			return route;
		}
	}
};

Router.prototype.find = function (path) {
	for (var i = 0, l = this.data.length; i < l; i++) {
		var route = this.data[i];
		if (this.isPath(route.path, path)) {
			return route;
		}
	}
};

Router.prototype.isPath = function (routePath, userPath) {
	return new RegExp(
		'^' + routePath
		.replace(/{\*}/g, '(?:.*)')
		.replace(/{(\w+)}/g, '([^\/]+)')
		+ '(\/)?$'
	).test(userPath || '/');
};

Router.prototype.toParameterObject = function (routePath, userPath) {
	var result = {};

	if (
		!routePath
		|| !userPath
		|| routePath === '/'
		|| userPath === '/'
	) return result;

	var brackets = /{|}/g;
	var pattern = /{(\w+)}/;
	var userPaths = userPath.split('/');
	var routePaths = routePath.split('/');

	for (var i = 0, l = routePaths.length; i < l; i++) {

		if (pattern.test(routePaths[i])) {
			var name = routePaths[i].replace(brackets, '');
			result[name] = userPaths[i];
		}

	}

	return result;
};

Router.prototype.toQueryString = function (data) {
	var result = '?';

	for (var key in data) {
		var value = data[key];
		result += key + '=' + value + '&';
	}

	if (result.slice(-1) === '&') {
		result = result.slice(0, -1);
	}

	return result;
};

Router.prototype.toQueryObject = function (path) {
	var result = {};

	if (path.indexOf('?') === 0) path = path.slice(1);
	var queries = path.split('&');

	for (var i = 0, l = queries.length; i < l; i++) {
		var query = queries[i].split('=');

		if (query[0] && query[1]) {
			result[query[0]] = query[1];
		}

	}

	return result;
};

Router.prototype.toLocationObject = function (path) {
	var location = {};

	location.port = window.location.port;
	location.host = window.location.host;
	location.hash = window.location.hash;
	location.origin = window.location.origin;
	location.hostname = window.location.hostname;
	location.protocol = window.location.protocol;
	location.username = window.location.username;
	location.password = window.location.password;

	location.pathname = decodeURI(path);
	location.base = Global.utility.base();
	location.basename = location.base;

	if (location.basename.indexOf(location.origin) === 0) {
		location.basename = location.basename.slice(location.origin.length);
	}

	if (location.pathname.indexOf(location.origin) === 0) {
		location.pathname = location.pathname.slice(location.origin.length);
	}

	if (location.pathname.indexOf(location.basename) === 0) {
		location.pathname = location.pathname.slice(location.basename.length);
	}

	if (location.pathname.indexOf(location.basename.slice(0, -1)) === 0) {
		location.pathname = location.pathname.slice(location.basename.slice(0, -1).length);
	}

	if (
		this.hash
		&& location.pathname.indexOf('#') === 0
		|| location.pathname.indexOf('/#') === 0
		|| location.pathname.indexOf('#/') === 0
		|| location.pathname.indexOf('/#/') === 0
	) {
		location.pathname = location.pathname.slice(2);
	}

	var hashIndex = location.pathname.indexOf('#');
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

	location.routePath = Global.utility.join('/', location.pathname);
	location.pathname = Global.utility.join(location.basename, location.pathname);
	location.href = Global.utility.join(location.origin, this.hash ? '#' : '/', location.pathname);

	if (this.trailing) {
		location.href = Global.utility.join(location.href, '/');
		location.pathname = Global.utility.join(location.pathname, '/');
	} else {
		location.href = location.href.replace(/\/{1,}$/, '');
		location.pathname = location.pathname.replace(/\/{1,}$/, '');
	}

	if (this.hash && /\/#$/.test(location.href)) {
		location.href = location.href + '/';
	}

	location.routePath = location.routePath || '/';
	location.pathname = location.pathname || '/';
	location.href += location.search;
	location.href += location.hash;

	return location;
};

Router.prototype.render = function (route) {

	if (document.readyState === 'interactive' || document.readyState === 'complete') {

		this.emit('routing');

		if (route.title) {
			document.title = route.title;
		}

		if (!this.element) {
			this.element = this.element || 'o-router';

			if (typeof this.element === 'string') {
				this.element = document.body.querySelector(this.element);
			}

			if (!this.element) {
				throw new Error('Oxe.router - Missing o-router');
			}

		}

		if (!route.element) {

			if (route.load) {
				Global.loader.load(route.load);
			}

			if (!route.component) {
				throw new Error('Oxe.router - missing route component');
			} else if (typeof route.component === 'string') {
				route.element = document.createElement(route.component);
			} else if (route.component.constructor.name === 'Object') {
				Global.component.define(route.component);
				route.element = document.createElement(route.component.name);
			} else if (route.component.constructor.name === 'Component') {
				route.element = route.component;
			}

			route.element.inRouterCache = false;
			route.element.isRouterComponent = true;
		}

		while (this.element.firstChild) {
			this.element.removeChild(this.element.firstChild);
		}

		this.element.appendChild(route.element);

		this.scroll(0, 0);
		this.emit('routed');

	} else {
		document.addEventListener('DOMContentLoaded', function _ () {
			this.render.bind(this, route);
			document.removeEventListener('DOMContentLoaded', _);
		}.bind(this), true);
	}

};

Router.prototype.route = function (data, options) {
	var location, route;

	options = options || {};

	if (typeof data === 'string') {

		if (options.query) {
			data += this.toQueryString(options.query);
		}

		location = this.toLocationObject(data);
		route = this.find(location.routePath) || {};

		location.title = route.title || '';
		location.query = this.toQueryObject(location.search);
		location.parameters = this.toParameterObject(route.path, location.routePath);

	} else {
		location = data;
		route = this.find(location.routePath) || {};
	}

	if (this.auth && (route.auth === true || route.auth === undefined)) {

		if (Global.keeper.route(route) === false) {
			return;
		}

	}

	if (route.handler) {
		return route.handler(route);
	}

	if (route.redirect) {
		return redirect(route.redirect);
	}

	if (this.compiled) {

		if (route.title) {
			document.title = route.title;
		}

		return;
	}

	this.location = location;

	window.history[options.replace ? 'replaceState' : 'pushState'](location, location.title, location.href);

	this.render(route);
};

Router.prototype.stateListener = function (e) {
	this.route(e.state || window.location.href, { replace: true });
};

Router.prototype.clickListener = function (e) {

	// if shadow dom use
	var target = e.path ? e.path[0] : e.target;
	var parent = target.parentNode;

	if (this.container) {

		while (parent) {

			if (parent === this.container) {
				break;
			} else {
				parent = parent.parentNode;
			}

		}

		if (parent !== this.container) {
			return;
		}

	}

	if (e.metaKey || e.ctrlKey || e.shiftKey) {
		return;
	}

	// ensure target is anchor tag
	while (target && 'A' !== target.nodeName) {
		target = target.parentNode;
	}

	if (!target || 'A' !== target.nodeName) {
		return;
	}

	// check non acceptables
	if (target.hasAttribute('download') ||
		target.hasAttribute('external') ||
		target.hasAttribute('o-external') ||
		target.href.indexOf('tel:') === 0 ||
		target.href.indexOf('ftp:') === 0 ||
		target.href.indexOf('file:') === 0 ||
		target.href.indexOf('mailto:') === 0 ||
		target.href.indexOf(window.location.origin) !== 0
	) return;

	// if external is true then default action
	if (this.external &&
		(this.external.constructor.name === 'RegExp' && this.external.test(target.href) ||
		this.external.constructor.name === 'Function' && this.external(target.href) ||
		this.external.constructor.name === 'String' && this.external === target.href)
	) return;

	if (this.location.href !== target.href) {
		this.route(target.href);
	}

	if (!this.compiled) {
		e.preventDefault();
	}

};

export default Router;
