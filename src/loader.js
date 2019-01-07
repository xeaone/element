import Transformer from './transformer.js';
import Path from './path.js';

export default {

	data: {},
	ran: false,
	methods: {},
	transformers: {},

	async setup (options) {
		let self = this;

		options = options || {};

		self.methods = options.methods || self.methods;
		self.transformers = options.transformers || self.transformers;

		if (options.loads) {
			return Promise.all(options.loads.map(function (load) {
				return self.load(load);
			}));
		}

	},

	async execute (data) {
		let text = '\'use strict\';\n\n' + (data.ast ? data.ast.cooked : data.text);
		let code = new Function('$LOADER', 'window', text);
		data.result = code(this, window);
	},

	async transform (data) {
		let self = this;

		if (data.transformer === 'es' || data.transformer === 'est') {
			data.text = Transformer.template(data.text);
		}

		if (data.transformer === 'es' || data.transformer === 'esm') {
			data.ast = Transformer.ast(data);
		}

		if (data.ast && data.ast.imports.length) {
			return Promise.all(data.ast.imports.map(function (imp) {
				return self.load({
					url: imp.url,
					method: data.method,
					transformer: data.transformer
				});
			}));
		}

	},

	async attach (data) {
		return new Promise(function (resolve, reject) {
			let element = document.createElement(data.tag);

			for (let name in data.attributes) {
				element.setAttribute(name, data.attributes[name]);
			}

			element.onload = resolve;
			element.onerror = reject;

			document.head.appendChild(element);
		});
	},

	async fetch (data) {
		let result = await window.fetch(data.url);

		if (result.status >= 200 && result.status < 300 || result.status == 304) {
			data.text = await result.text();
		} else {
			throw new Error(result.statusText);
		}

	},

	async js (data) {

		if (
			data.method === 'fetch'
			|| data.transformer === 'es'
			|| data.transformer === 'est'
			|| data.transformer === 'esm'
		) {
			await this.fetch(data);

			if (data.transformer) {
				await this.transform(data);
			}

			return this.execute(data);
		}

		if (data.method === 'script') {
			return this.attach({
				tag: 'script',
				attributes: {
					src: data.url,
					type: 'text/javascript'
				}
			});
		}

		await this.attach({
			tag: 'script',
			attributes: {
				src: data.url,
				type: 'module'
			}
		});
	},

	async css (data) {
		if (data.method === 'fetch') {
			await this.fetch(data);
		} else {
			await this.attach({
				tag: 'link',
				attributes: {
					href: data.url,
					type: 'text/css',
					rel: 'stylesheet'
				}
			});
		}
	},

	async load (data) {

		if (typeof data === 'string') {
			data = { url: data };
		}

		data.url = Path.resolve(data.url);

		if (data.url in this.data) {
			await Promise.resolve(this.data[data.url].promise());
			return this.data[data.url].result;
		}

		this.data[data.url] = data;

		data.extension = data.extension || Path.extension(data.url);
		data.method = data.method || this.methods[data.extension];
		data.transformer = data.transformer || this.transformers[data.extension];

		if (data.extension === 'js') {
			data.promise = this.js(data);
		} else if (data.extension === 'css') {
			data.promise = this.css(data);
		} else {
			data.promise = this.fetch(data);
		}

		await Promise.resolve(data.promise());
		return data.result;
	}

};

/*
	https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
*/
