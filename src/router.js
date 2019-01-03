import Path from './path.js';
import Loader from './loader.js';
import Utility from './utility.js';
import Component from './component.js';
import Events from './class/events.js';

class Router extends Events {

	constructor () {
		super();
		this.data = [];
		this.ran = false;
		this.location = {};
		this.mode = 'push';
		this.element = null;
		this.contain = false;
		this.parser = document.createElement('a');
	}

	isPath (routePath, userPath) {
		userPath = userPath || '/';

		if (routePath.slice(0, 1) !== '/') {
			routePath = Path.resolve(routePath);
		}

		if (userPath.constructor === String) {
			var userParts = userPath.split('/');
			var routeParts = routePath.split('/');

			for (let i = 0, l = routeParts.length; i < l; i++) {
				if (routeParts[i].indexOf('{') === 0 && routeParts[i].indexOf('}') === routeParts[i].length-1) {
					continue
				} else if (routeParts[i] !== userParts[i]) {
					return false;
				}
			}

			return true;
		}

		if (userPath.constructor === RegExp) {
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
		this.parser.href = href;
		return {
			href: this.parser.href,
			host: this.parser.host,
			port: this.parser.port,
			hash: this.parser.hash,
			search: this.parser.search,
			protocol: this.parser.protocol,
			hostname: this.parser.hostname,
			pathname: this.parser.pathname[0] === '/' ? this.parser.pathname : '/' + this.parser.pathname
		};
	}

	async setup (options) {
		options = options || {};

		this.mode = options.mode === undefined ? this.mode : options.mode;
		this.after = options.after === undefined ? this.after : options.after;
		this.before = options.before === undefined ? this.before : options.before;
		this.change = options.change === undefined ? this.change : options.change;
		this.element = options.element === undefined ? this.element : options.element;
		this.contain = options.contain === undefined ? this.contain : options.contain;
		this.external = options.external === undefined ? this.external : options.external;

		if (options.routes) {
			await this.add(options.routes);
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

	remove (path) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			let route = this.data[i];
			if (route.path === path) {
				this.data.splice(i, 1);
			}
		}
	}

	get (path) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			let route = this.data[i];
			if (route.path === path) {
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

	async add (data) {
		let self = this;

		if (!data) {
			throw new Error('Oxe.router.add - requires data parameter');
		} else if (data.constructor === String) {
			let route = await Loader.load(data);
			this.data.push(route);
			// this.data.push({ path: data, load: data });
		} else if (data.constructor === Object) {
			if (!data.path) throw new Error('Oxe.router.add - route path required');
			// if (!data.component) throw new Error('Oxe.router.add - route component required');
			this.data.push(data);
		} else if (data.constructor === Array) {
			// return Promise.all(data.map(function (route) {
			// 	if (data.constructor === String) {
			// 		return Loader.load(data);
			// 	} else {
			// 		return route;
			// 	}
			// })).then(function (routes) {
			// 	routes.forEach(function (route) {
			// 		self.data.push(route);
			// 	});
			// });
			for (let i = 0, l = data.length; i < l; i++) {
				await this.add(data[i]);
			}
		}
	}

	async find (path) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			let route = this.data[i];
			if (this.isPath(route.path, path)) {
				// if (route.load) {
				// 	let routePath = this.data[i];
				// 	this.data[i] = await Loader.load(route.load);
				// 	this.data[i].path = routePath;
				// 	return this.data[i];
				// } else {
					return route;
				// }
			}
		}
	}

	async render (route) {

		if (!route) {
			throw new Error('Oxe.render - route argument required');
		}

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

			// if (route.load) {
			// 	Loader.load(route.load);
			// }

			if (route.component.constructor === String) {
				route.element = document.createElement(route.component);
			}

			if (route.component.constructor === Object) {

				Component.define(route.component);

				if (this.mode === 'compiled') {
				// if (route.component.name.toLowerCase() === this.element.firstElementChild.nodeName.toLowerCase()) {
					route.element = this.element.firstElementChild;
				} else {
					route.element = document.createElement(route.component.name);
				}

			}

		}

		if (!route.component && !route.element) {
			throw new Error('Oxe.router.render - missing route component and');
		}

		if (route.element !== this.element.firstElementChild) {

			while (this.element.firstChild) {
				this.element.removeChild(this.element.firstChild);
			}

			this.element.appendChild(route.element);

		}

		this.scroll(0, 0);
	}

	async route (path, options) {
		options = options || {};

		if (options.query) {
			path += this.toQueryString(options.query);
		}

		const mode = options.mode || this.mode;
		const location = this.toLocationObject(path);
		const route = await this.find(location.pathname);

		if (!route) {
			throw new Error(`Oxe.router.route - missing route ${location.pathname}`);
		}

		location.route = route;
		location.title = location.route.title;
		location.query = this.toQueryObject(location.search);
		location.parameters = this.toParameterObject(location.route.path, location.pathname);

		// if (location.route && location.route.handler) {
		// 	return await location.route.handler(location);
		// }

		if (location.route && location.route.redirect) {
			return this.redirect(location.route.redirect);
		}

		if (typeof this.change === 'function') {
			const result = await this.change(location);
			this.location = Object.assign(location, result || {});
		} else {
			this.location = location;
		}

		this.emit('route:before');

		if (typeof this.before === 'function') {
			await this.before();
		}

		path = location.pathname + location.search + location.hash;

		if (mode === 'href' || mode === 'compiled') {
			return window.location.assign(path);
		}

		window.history[mode + 'State']({ path: path }, '', path);

		await this.render(this.location.route);

		if (typeof this.after === 'function') {
			await this.after();
		}

		this.emit('route:after');

	}

}

export default new Router();
