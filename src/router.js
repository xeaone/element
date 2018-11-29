import Path from './path.js';
import Loader from './loader.js';
import Utility from './utility.js';
import Component from './component.js';
import Events from './class/events.js';

class Router extends Events {

	constructor () {
		super();
		this.data = [];
		this.location = {};
		this.ran = false;
		this.mode = 'push';
		this.element = null;
		this.contain = false;
		this.pattern = new RegExp([
		    '^(https?:)//', // protocol
		    '(([^:/?#]*)(?::([0-9]+))?)', // host, hostname, port
		    '(/{0,1}[^?#]*)', // pathname
		    '(\\?[^#]*|)', // search
		    '(#.*|)$' // hash
		].join(''));
	}

	async setup (options) {
		options = options || {};

		this.mode = options.mode === undefined ? this.mode : options.mode;
		this.after = options.after === undefined ? this.after : options.after;
		this.before = options.before === undefined ? this.before : options.before;
		this.element = options.element === undefined ? this.element : options.element;
		this.contain = options.contain === undefined ? this.contain : options.contain;
		this.external = options.external === undefined ? this.external : options.external;

		if (options.routes) {
			this.add(options.routes);
		}

		await this.route(window.location.href, { mode: 'replace' });
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
			for (let i = 0, l = data.length; i < l; i++) {
				this.add(data[i]);
			}
		}
	}

	remove (path) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			if (path === this.data[i].path) {
				this.data.splice(i, 1);
			}
		}
	}

	get (path) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			let route = this.data[i];
			if (path === route.path) {
				return route;
			}
		}
	}

	find (path) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			let route = this.data[i];
			if (this.isPath(route.path, path)) {
				return route;
			}
		}
	}

	filter (path) {
		let result = [];

		for (let i = 0, l = this.data.length; i < l; i++) {
			let route = this.data[i];
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
		let result = {};

		if (
			!routePath
			|| !userPath
			|| routePath === '/'
			|| userPath === '/'
		) return result;

		let brackets = /{|}/g;
		let pattern = /{(\w+)}/;
		let userPaths = userPath.split('/');
		let routePaths = routePath.split('/');

		for (let i = 0, l = routePaths.length; i < l; i++) {

			if (pattern.test(routePaths[i])) {
				let name = routePaths[i].replace(brackets, '');
				result[name] = userPaths[i];
			}

		}

		return result;
	}

	toQueryString (data) {
		let result = '?';

		for (let key in data) {
			let value = data[key];
			result += key + '=' + value + '&';
		}

		if (result.slice(-1) === '&') {
			result = result.slice(0, -1);
		}

		return result;
	}

	toQueryObject (path) {
		let result = {};

		if (path.indexOf('?') === 0) path = path.slice(1);
		let queries = path.split('&');

		for (let i = 0, l = queries.length; i < l; i++) {
			let query = queries[i].split('=');

			if (query[0] && query[1]) {
				result[query[0]] = query[1];
			}

		}

		return result;
	}

	toLocationObject (href) {
		var match = href.match(this.pattern) || [];
		return {
			href: href,
			protocol: match[1],
			host: match[2],
			hostname: match[3],
			port: match[4],
			pathname: match[5],
			search: match[6],
			hash: match[7]
		};
	}

	render (route) {
		var self = this;

		if (!route) throw new Error('Oxe.render - route argument required');

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

			if (!self.element) {
				self.element = self.element || 'o-router';

				if (typeof self.element === 'string') {
					self.element = document.body.querySelector(self.element);
				}

				if (!self.element) {
					throw new Error('Oxe.router.render - missing o-router element');
				}

			}

			if (!route.element) {

				if (route.load) {
					Loader.load(route.load);
				}

				if (!route.component) {
					throw new Error('Oxe.router.render - missing route component');
				} else if (route.component.constructor === String) {
					route.element = document.createElement(route.component);
				} else if (route.component.constructor === Object) {

					Component.define(route.component);

					if (self.mode === 'compiled') {
						route.element = self.element.firstChild;
					} else {
						route.element = document.createElement(route.component.name);
					}

				}

			}

			while (self.element.firstChild) {
				self.element.removeChild(self.element.firstChild);
			}

			self.element.appendChild(route.element);

			self.scroll(0, 0);
			self.emit('routed');

			if (typeof self.after === 'function') {
				Promise.resolve(self.after).catch(console.error);
			}

		});
	}

	async route (path, options) {
		options = options || {};

		var mode = options.mode || this.mode;
		var location = this.toLocationObject(path);
		var route = this.find(location.pathname);

		if (!route) {
			throw new Error('Oxe.router.route - route not found');
		}

		location.route = route;
		location.title = location.route.title;
		location.query = this.toQueryObject(location.search);
		location.parameters = this.toParameterObject(location.route.path, location.pathname);

		if (options.query) {
			path += this.toQueryString(options.query);
		}

		if (typeof this.before === 'function') {
			var result = await this.before(location);
			if (result === false) return;
		}

		if (location.route && location.route.handler) {
			return await location.route.handler(location);
		}

		if (location.route && location.route.redirect) {
			return this.redirect(location.route.redirect);
		}

		if (mode === 'href' || mode === 'compiled') {
			return window.location.assign(path);
		} else {
			window.history[mode + 'State']({ path: path }, '', path);
		}

		this.location = location;
		this.emit('routing');
		this.render(location.route);
	}

}

export default new Router();
