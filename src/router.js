import Path from './path.js';
import Events from './events.js';
import Loader from './loader.js';
import Utility from './utility.js';
import Component from './component.js';

class Router extends Events {

	constructor () {
		super();

		this.data = [];
		this.location = {};

		this.ran = false;
		this.element = null;
		this.contain = false;
		this.compiled = false;
	}

	setup (options) {
		options = options || {};

		this.after = options.after === undefined ? this.after : options.after;
		this.before = options.before === undefined ? this.before : options.before;
		this.element = options.element === undefined ? this.element : options.element;
		this.contain = options.contain === undefined ? this.contain : options.contain;
		this.external = options.external === undefined ? this.external : options.external;
		// this.validate = options.validate === undefined ? this.validate : options.validate;

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

	forward () {
		window.history.forward();
	}

	redirect (path) {
		window.location.href = path;
	}

	add (data) {
		if (!data) {
			throw new Error('Oxe.router.add - requires data parameter');
		} else if (data.constructor === Object) {
			if (!data.path) throw new Error('Oxe.router.add - route path required');
			if (!data.component) throw new Error('Oxe.router.add - route component required');
			this.data.push(data);
		} else if (data.constructor === Array) {
			for (var i = 0, l = data.length; i < l; i++) {
				this.add(data[i]);
			}
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

		if (routePath.slice(0, 1) !== '/') {
			routePath = Path.resolve(routePath);
		}

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

	toLocationObject () {
		return {
			port: window.location.port || '',
			host: window.location.host || '',
			hash: window.location.hash || '',
			href: window.location.href || '',
			origin: window.location.origin || '',
			search: window.location.search || '',
			pathname: window.location.pathname || '',
			hostname: window.location.hostname || '',
			protocol: window.location.protocol || '',
			username: window.location.username || '',
			password: window.location.password || ''
		};
	}

	// validate () {
	//
	// }

	render (route) {
		Utility.ready(function () {

			if (route.title) {
				document.title = route.title;
			}

			if (route.description) {
				Utility.ensureElement({
					name: 'meta',
					scope: document.head,
					position: 'afterbegin',
					query: '[name="description"]',
					attributes: [
						{ name: 'name', value: 'description' },
						{ name: 'content', value: route.description }
					]
				});
			}

			if (route.keywords) {
				Utility.ensureElement({
					name: 'meta',
					scope: document.head,
					position: 'afterbegin',
					query: '[name="keywords"]',
					attributes: [
						{ name: 'name', value: 'keywords' },
						{ name: 'content', value: route.keywords }
					]
				});
			}

			if (!this.element) {
				this.element = this.element || 'o-router';

				if (typeof this.element === 'string') {
					this.element = document.body.querySelector(this.element);
				}

				if (!this.element) {
					throw new Error('Oxe.router.render - missing o-router element');
				}

			}

			if (!route.element) {

				if (route.load) {
					Loader.load(route.load);
				}

				if (!route.component) {
					throw new Error('Oxe.router.render - missing route component');
				} else if (route.component.constructor.name === 'String') {
					route.element = document.createElement(route.component);
				} else if (route.component.constructor.name === 'Object') {

					Component.define(route.component);

					if (this.compiled) {
						route.element = this.element.firstChild;
					} else {
						route.element = document.createElement(route.component.name);
					}

				}

			}

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

	route (path, options) {
		options = options || {};

		if (options.query) {
			path += this.toQueryString(options.query);
		}

		// todo might need to be moved to the end
		if (!this.compiled) {
			window.history[options.replace ? 'replaceState' : 'pushState']({ path: path }, '', path);
		}

		const location = this.toLocationObject();

		location.route = this.find(location.pathname);

		if (!location.route) {
			throw new Error('Oxe.router.route - route not found');
		}

		location.title = location.route.title || '';
		location.query = this.toQueryObject(location.search);
		location.parameters = this.toParameterObject(location.route.path, location.pathname);

		// if (this.auth || location.route.auth && typeof this.validate === 'function') {
		// 	const data = this.validate(location);
		// 	if (!data.valid) return this.route(data.path);
		// }

		if (typeof this.before === 'function') {
			const result = this.before(location);
			if (result === false) return;
		}

		if (location.route.handler) {
			return route.handler(location.route);
		}

		if (location.route.redirect) {
			return this.redirect(location.route.redirect);
		}

		this.location = location;
		this.emit('routing');
		this.render(location.route);
	}

}

export default new Router();
