import Events from './lib/events.js';
import Path from './lib/path.js';
import Global from './global.js';

export default class Router extends Events {

	constructor () {
		super();

		this.data = [];
		this.location = {};

		this.ran = false;
		this.auth = false;
		this.hash = false;
		this.trailing = false;

		this.element = null;
		this.contain = false;
		this.compiled = false;

		document.addEventListener('click', this.clickListener.bind(this), true);
		window.addEventListener('popstate', this.stateListener.bind(this), true);
	}

	setup (options) {
		options = options || {};

		this.auth = options.auth === undefined ? this.auth : options.auth;
		this.hash = options.hash === undefined ? this.hash : options.hash;
		this.element = options.element === undefined ? this.element : options.element;
		this.contain = options.contain === undefined ? this.contain : options.contain;
		this.external = options.external === undefined ? this.external : options.external;
		this.trailing = options.trailing === undefined ? this.trailing : options.trailing;

		if (options.routes) {
			this.add(options.routes);
		}

		this.route(window.location.href, { replace: true });
	}

	scroll (x, y) {
		window.scroll(x, y);
	}

	back () {
		window.history.back();
	}

	redirect (path) {
		window.location.href = path;
	}

	add (data) {
		if (!data) {
			throw new Error('Oxe.router.add - requires data parameter');
		} else if (data.constructor.name === 'Object') {
			Array.prototype.push.call(this.data, data);
		} else if (data.constructor.name === 'Array') {
			Array.prototype.push.apply(this.data, data);
		}
	}

	remove (path) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			if (path === this.data[i].path) {
				this.data.splice(i, 1);
			}
		}
	}

	get (path) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			var route = this.data[i];
			if (path === route.path) {
				return route;
			}
		}
	}

	find (path) {
		for (var i = 0, l = this.data.length; i < l; i++) {
			var route = this.data[i];
			if (this.isPath(route.path, path)) {
				return route;
			}
		}
	}

	filter (path) {
		var result = [];

		for (var i = 0, l = this.data.length; i < l; i++) {
			var route = this.data[i];
			if (this.isPath(route.path, path)) {
				result.push(route);
			}
		}

		return result;
	}

	isPath (routePath, userPath) {
		if (!userPath) {
			return false;
		} else if (userPath.constructor.name === 'String') {
			return new RegExp(
				'^' + routePath
				.replace(/{\*}/g, '(?:.*)')
				.replace(/{(\w+)}/g, '([^\/]+)')
				+ '(\/)?$'
			).test(userPath || '/');
		} else if (userPath.constructor.name === 'RegExp') {
			return userPath.test(routePath);
		}
	}

	toParameterObject (routePath, userPath) {
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
	}

	toQueryString (data) {
		var result = '?';

		for (var key in data) {
			var value = data[key];
			result += key + '=' + value + '&';
		}

		if (result.slice(-1) === '&') {
			result = result.slice(0, -1);
		}

		return result;
	}

	toQueryObject (path) {
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
	}

	toLocationObject (path) {
		var location = {};

		location.port = window.location.port;
		location.host = window.location.host;
		location.hash = window.location.hash;
		location.origin = window.location.origin;
		location.hostname = window.location.hostname;
		location.protocol = window.location.protocol;
		location.username = window.location.username;
		location.password = window.location.password;

		location.pathname = path;
		location.base = Path.base();
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

		location.routePath = Path.join('/', location.pathname);
		location.pathname = Path.join(location.basename, location.pathname);
		location.href = Path.join(location.origin, this.hash ? '#' : '/', location.pathname);

		if (this.trailing) {
			location.href = Path.join(location.href, '/');
			location.pathname = Path.join(location.pathname, '/');
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
	}

	render (route) {
		Global.utility.ready(function () {

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
					throw new Error('Oxe.router - missing o-router element');
				}

			}

			if (!route.element) {

				if (route.load) {
					Global.loader.load(route.load);
				}

				if (!route.component) {
					throw new Error('Oxe.router - missing route component');
				} else if (route.component.constructor.name === 'String') {
					route.element = document.createElement(route.component);
				} else if (route.component.constructor.name === 'Object') {

					Global.component.define(route.component);

					if (this.compiled) {
						route.element = this.element.firstChild;
					} else {
						route.element = document.createElement(route.component.name);
					}

				}

			}

			route.element.inRouterCache = false;
			route.element.isRouterComponent = true;

			if (!this.compiled) {

				while (this.element.firstChild) {
					this.element.removeChild(this.element.firstChild);
				}

				this.element.appendChild(route.element);
			}

			this.scroll(0, 0);
			this.emit('routed');

		}.bind(this));
	}

	route (data, options) {
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

		this.location = location;

		if (!this.compiled) {
			window.history[options.replace ? 'replaceState' : 'pushState'](location, location.title, location.href);
		}

		this.render(route);
	}

	stateListener (e) {
		this.route(e.state || window.location.href, { replace: true });
	}

	clickListener (e) {

		// if shadow dom use
		var target = e.path ? e.path[0] : e.target;
		var parent = target.parentNode;

		if (this.contain) {

			while (parent) {

				if (parent.nodeName === 'O-ROUTER') {
					break;
				} else {
					parent = parent.parentNode;
				}

			}

			if (parent.nodeName !== 'O-ROUTER') {
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

	}

}
