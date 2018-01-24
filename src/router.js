import Events from './lib/events';
import Global from './global';

var Router = function (options) {
	Events.call(this);

	this.route = {};
	this.routes = [];
	this.location = {};

	this.ran = false;
	this.auth = false;
	this.hash = false;
	this.trailing = false;

	this.clone = null;
	this.element = null;
	this.container = null;

	this.setup(options);
};

Router.prototype = Object.create(Events.prototype);
Router.prototype.constructor = Router;

Router.prototype.setup = function (options) {
	options = options || {};
	this.container = options.container;
	this.auth = options.auth === undefined ? this.auth : options.auth;
	this.hash = options.hash === undefined ? this.hash : options.hash;
	this.routes = options.routes === undefined ? this.routes: options.routes;
	this.element = options.element === undefined ? this.element : options.element;
	this.external = options.external === undefined ? this.external : options.external;
	this.trailing = options.trailing === undefined ? this.trailing : options.trailing;
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

		if (this.isPath(route.path, path)) {
			return route;
		}

	}

};

Router.prototype.isPath = function (routePath, userPath) {
	userPath = userPath || '/';

	return new RegExp(
		'^' + routePath
		.replace(/{\*}/g, '(?:.*)')
		.replace(/{(\w+)}/g, '([^\/]+)')
		+ '(\/)?$'
	).test(userPath);
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
	var self = this;

	self.emit('navigating');

	if (route.title) {
		document.title = route.title;
	}

	if (route.url) {
		Global.loader.load(route.url);
	}

	self.domReady(function () {
		self.routeReady(route, function () {
			// self.element.parentNode.insertBefore(route.element, self.element);
			// self.element.parentNode.removeChild(self.element);

			self.element.parentNode.replaceChild(route.element, self.element);
			self.element = route.element;

			// while (self.element.firstChild) {
			// 	self.element.removeChild(self.element.firstChild);
			// }
            //
			// while (route.element.firstChild) {
			// 	self.element.appendChild(route.element.firstChild);
			// }
            //
			// console.log(route.element);

			self.scroll(0, 0);
			self.emit('navigated');
		});
	});

};

Router.prototype.navigate = function (data, options) {
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

	console.log(location);
	console.log(this.location);

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

	this.route = route;
	this.location = location;

	window.history[options.replace ? 'replaceState' : 'pushState'](location, location.title, location.href);

	this.render(route);
};

Router.prototype.routeReady = function (data, callback) {

	if (data.element) {
		return callback(data);
	}

	if (typeof data.template === 'function') {
		return data.template(function (t) {
			data.template = t;
			this.routeReady(data, callback);
		}.bind(this));
	}

	var template = this.clone.cloneNode();

	if (typeof data.template === 'string') {
		template.innerHTML = data.template;
	} else if (typeof data.template === 'object') {
		template.appendChild(data.template);
	}

	data.element = template;
	data.element.inRouterCache = false;
	data.element.isRouterComponent = true;

	callback(data);
};

Router.prototype.elementReady = function (callback) {

	if (this.clone && this.element) {
		return callback();
	}

	var element = this.element || 'o-router';

	if (typeof element === 'string') {
		element = document.body.querySelector(element);
	}

	if (!element) {
		throw new Error('Oxe.router - Missing o-router element or attribute');
	}

	this.element = element;
	this.clone = element.cloneNode();

	callback();
};

Router.prototype.domReady = function (callback) {
	if (document.readyState === 'interactive' || document.readyState === 'complete') {
		this.elementReady(callback);
	} else {
		document.addEventListener('DOMContentLoaded', this.elementReady.bind(this, callback), true);
	}
};

Router.prototype.stateListener = function (e) {
	this.navigate(e.state || window.location.href, { replace: true });
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

	e.preventDefault();

	if (this.location.href !== target.href) {
		this.navigate(target.href);
	}

};

Router.prototype.run = function () {

	if (this.ran) {
		return;
	} else {
		this.ran = true;
	}

	var options = { replace: true };

	document.addEventListener('click', this.clickListener.bind(this), true);
	window.addEventListener('popstate', this.stateListener.bind(this), true);
	this.navigate(window.location.href, options);
};

export default Router;
