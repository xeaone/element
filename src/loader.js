import Transformer from './transformer.js';
import Path from './path.js';

export default {

	data: {},
	type: {
		js: 'attach',
		css: 'attach'
	},

	async setup (options) {
		const self = this;

		options = options || {};

		if (options.loads) {
			return Promise.all(options.loads.map(function (load) {
				return self.load(load);
			}));
		}

	},

	async execute (data) {
		const code = '\'use strict\';\n' + data;
		const method = new Function('$LOADER', 'window', code);
		return method(this, window);
	},

	async attach (name, attributes) {
		return new Promise(function (resolve, reject) {
			const element = document.createElement(name);

			element.onload = resolve;
			element.onerror = reject;

			for (const key in attributes) {
				element.setAttribute(key, attributes[key]);
			}

			document.head.appendChild(element);
		});
	},

	async transform (code, type, url) {
		const self = this;
		const ast = {};

		if (type === 'es' || type=== 'est') {
			ast.raw = Transformer.template(code);
		}

		if (type === 'es' || type === 'esm') {
			ast = Transformer.ast(ast.raw, url);

			if (ast.imports.length) {

				const imports = ast.imports.map(function (module) {
					return self.load({ url: module.url, type });
				});

				await Promise.all(imports);
			}

		}

		return ast;
	},

	async fetch (path) {
		const result = await window.fetch(path);

		if (result.status >= 200 && result.status < 300 || result.status == 304) {
			return result.text();
		} else if (result.status == 404) {
			throw new Error(`Oxe.loader.fetch - not found ${path}`);
		} else {
			throw new Error(result.statusText);
		}

	},

	async js (data) {
		if (data.type === 'es' || data.type === 'est' || data.type === 'esm' || data.type === 'fetch') {
			data.text = await this.fetch(data.url);

			if (data.type === 'es' || data.type === 'est' || data.type === 'esm') {
				data.ast = await this.transform(data.text, data.type, data.url);
			}

			return this.execute(data.ast ? data.ast.cooked : data.text);
		} else if (data.type === 'script') {
			return this.attach('script', { src: data.url, type: 'text/javascript' });
		} else {
			return this.attach('script', { src: data.url, type: 'module' });
		}
	},

	async css (data) {
		if (data.type === 'fetch') {
			data.text = await this.fetch(data);
		} else {
			await this.attach('link', { href: data.url, type: 'text/css', rel: 'stylesheet' });
		}
	},

	async load (data) {
		let result;

		if (typeof data === 'string') {
			data = { url: data };
		}

		data.url = Path.resolve(data.url);

		if (data.url in this.data) {
			result = await this.data[data.url].promise;

			if (result.default) {
				this.data[data.url].result = result.default;
			} else {
				this.data[data.url].result = result;
			}

			return this.data[data.url].result;
		}

		this.data[data.url] = data;

		data.extension = data.extension || Path.extension(data.url);
		data.type = data.type || this.type[data.extension];

		if (data.extension === 'js') {
			// if (data.type === 'import' && window.import) {
				// data.promise = import(data.url);
			// } else {
          		data.promise = this.js(data);
			// }
		} else if (data.extension === 'css') {
			data.promise = this.css(data);
		} else {
			data.promise = this.fetch(data.url);
		}

		result = await data.promise;

		if (result.default) {
			data.result = result.default;
		} else {
			data.result = result;
		}

		return data.result;
	}

};

/*
	https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
*/
