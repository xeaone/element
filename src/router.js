import Path from './path.js';
// import Loader from './loader.js';
import Events from './events.js';
import Utility from './utility.js';
import Component from './component.js';

const events = Object.create(Events);

export default {

	on: events.on.bind(events),
	off: events.off.bind(events),
	emit: events.emit.bind(events),

	data: [],
	ran: false,
	location: {},
	mode: 'push',
	element: null,
	contain: false,
	compiled: false,
	folder: './routes',

	compare (routePath, userPath) {
		const base = Path.normalize(Path.base);

		userPath = Path.normalize(userPath);
		routePath = Path.normalize(routePath);

		if (userPath.slice(0, base.length) !== base) {
			userPath = Path.join(base, userPath);
		}

		if (routePath.slice(0, base.length) !== base) {
			routePath = Path.join(base, routePath);
		}

		const userParts = userPath.split('/');
		const routeParts = routePath.split('/');
		const compareParts = [];

		if (userParts.length > 1 && userParts[userParts.length-1] === '') {
			userParts.pop();
		}

		if (routeParts.length > 1 && routeParts[routeParts.length-1] === '') {
			routeParts.pop();
		}

		for (let i = 0, l = routeParts.length; i < l; i++) {

			if (routeParts[i].slice(0, 1) === '(' && routeParts[i].slice(-1) === ')') {

				if (routeParts[i].indexOf('*') !== -1) {
					return true;
				} else {
					compareParts.push(userParts[i]);
				}

			} else if (routeParts[i] !== userParts[i]) {
				return false;
			} else {
				compareParts.push(routeParts[i]);
			}

		}

		if (compareParts.join('/') === userParts.join('/')) {
			return true;
		} else {
			return false;
		}

	},

	toParameterObject (routePath, userPath) {
		let result = {};

		if (
			!routePath
			|| !userPath
			|| routePath === '/'
			|| userPath === '/'
		) return result;

		let brackets = /\(|\)/g;
		let pattern = /\((\w+)\)/;
		let userPaths = userPath.split('/');
		let routePaths = routePath.split('/');

		for (let i = 0, l = routePaths.length; i < l; i++) {

			if (pattern.test(routePaths[i])) {
				let name = routePaths[i].replace(brackets, '');
				result[name] = userPaths[i];
			}

		}

		return result;
	},

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
	},

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
	},

	toLocationObject (href) {
		const location = {};
		const parser = document.createElement('a');

		parser.href = href;

		location.href = parser.href;
		location.host = parser.host;
		location.port = parser.port;
		location.hash = parser.hash;
		location.search = parser.search;
		location.protocol = parser.protocol;
		location.hostname = parser.hostname;
		location.pathname = parser.pathname[0] === '/' ? parser.pathname : '/' + parser.pathname;

		location.path = location.pathname + location.search + location.hash;

		// might need to check how base should work

		  // var base = document.querySelector('base');
		  //
		  // location.pathname = parser.pathname;
		  // location.base = base ? base.href : null;
		  //
		  // if (location.protocol === 'file:' && location.base) {
	      // 	location.pathname = parser.pathname.replace(location.base.replace('file://', ''), '');
		  // }
		  //
	      // location.pathname = location.pathname[0] === '/' ? location.pathname : '/' + location.pathname;
	      // location.path = location.pathname + location.search + location.hash;

		return location;
	},

	scroll (x, y) {
		window.scroll(x, y);
	},

	back () {
		window.history.back();
	},

	forward () {
		window.history.forward();
	},

	redirect (path) {
		window.location.href = path;
	},

	async add (data) {
		if (!data) {
			return;
		} else if (data.constructor === String) {
			let path = data;

			if (path.slice(-3) === '.js') {
				path = path.slice(0, -3);
			}

			let load = path;

			if (path.slice(-5) === 'index') {
				path = path.slice(0, -5);
			}

			if (path.slice(-6) === 'index/') {
				path = path.slice(0, -6);
			}

			if (path.slice(0, 2) === './') {
				path = path.slice(2);
			}

			if (path.slice(0, 1) !== '/') {
				path = '/' + path;
			}

			load = load + '.js';
			load = Path.join(this.folder, load);

			this.data.push({ path, load });
		} else if (data.constructor === Object) {

			if (!data.path) {
				throw new Error('Oxe.router.add - route path required');
			}

			if (!data.load && !data.component) {
				throw new Error('Oxe.router.add -  route.component or route.load required');
			}

			this.data.push(data);
		} else if (data.constructor === Array) {

			for (let i = 0, l = data.length; i < l; i++) {
				await this.add(data[i]);
			}

		}
	},

	async setup (options) {
		options = options || {};

		this.base = options.base === undefined ? this.base : options.base;
		this.mode = options.mode === undefined ? this.mode : options.mode;
		this.after = options.after === undefined ? this.after : options.after;
		this.folder = options.folder === undefined ? this.folder : options.folder;
		this.before = options.before === undefined ? this.before : options.before;
		this.change = options.change === undefined ? this.change : options.change;
		this.element = options.element === undefined ? this.element : options.element;
		this.contain = options.contain === undefined ? this.contain : options.contain;
		this.external = options.external === undefined ? this.external : options.external;

		if (!this.element || typeof this.element === 'string') {
			this.element = document.body.querySelector(this.element || 'o-router');
		}

		if (!this.element) {
			throw new Error('Oxe.router.render - missing o-router element');
		}

		await this.add(options.routes);
		await this.route(window.location.href, { mode: 'replace' });
	},

	async load (route) {
		// let type = Loader.type.js;
		//
		// if (Loader.type.js !== 'es' && Loader.type.js !== 'est' && Loader.type.js !== 'esm') {
		// 	type = 'esm';
		// }

		if (route.load) {
			// const load = await Loader.load({
			// 	type: type,
			// 	url: route.load
			// });
			const load = await window.import(route.load);
			route = Object.assign({}, load.default, route);
		}

		if (typeof route.component === 'string') {
			route.load = route.component;
			const load = await window.import(route.load);
			console.log(load);
			route.component = load.default;
			// route.component = await Loader.load({
			// 	type: type,
			// 	url: route.load
			// });
		}

		return route;
	},

	async remove (path) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			if (this.data[i].path === path) {
				this.data.splice(i, 1);
			}
		}
	},

	async get (path) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			if (this.data[i].path === path) {
				this.data[i] = await this.load(this.data[i]);
				return this.data[i];
			}
		}
	},

	async filter (path) {
		const result = [];

		for (let i = 0, l = this.data.length; i < l; i++) {
			if (this.compare(this.data[i].path, path)) {
				this.data[i] = await this.load(this.data[i]);
				result.push(this.data[i]);
			}
		}

		return result;
	},

	async find (path) {
		for (let i = 0, l = this.data.length; i < l; i++) {
			if (this.compare(this.data[i].path, path)) {
				this.data[i] = await this.load(this.data[i]);
				return this.data[i];
			}
		}
	},

	async render (route) {

		if (!route) {
			throw new Error('Oxe.render - route argument required. Missing object option.');
		}

		if (!route.component && !route.element) {
			throw new Error('Oxe.render - route property required. Missing component or element option.');
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

		if (!route.element) {
			if (route.component.constructor === String) {
				route.element = document.createElement(route.component);
			} else if (route.component.constructor === Object) {
				Component.define(route.component);

				if (this.compiled) {
				// if (route.component.name.toLowerCase() === this.element.firstElementChild.nodeName.toLowerCase()) {
					route.element = this.element.firstElementChild;
				} else {
					route.element = document.createElement(route.component.name);
				}
			}
		}

		if (route.element !== this.element.firstElementChild) {

			while (this.element.firstChild) {
				this.element.removeChild(this.element.firstChild);
			}

			this.element.appendChild(route.element);
		}

		this.scroll(0, 0);
	},

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

		if (location.route && location.route.handler) {
			return await location.route.handler(location);
		}

		if (location.route && location.route.redirect) {
			return await this.redirect(location.route.redirect);
		}

		if (typeof this.before === 'function') {
			await this.before(location);
		}

		this.emit('route:before', location);

		if (mode === 'href' || this.compiled) {
			return window.location.assign(location.path);
		}

		window.history[mode + 'State']({ path: location.path }, '', location.path);

		this.location = location;

		await this.render(location.route);

		if (typeof this.after === 'function') {
			await this.after(location);
		}

		this.emit('route:after', location);
	}

};
