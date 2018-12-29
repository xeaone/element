import Transformer from './transformer.js';
import Events from './class/events.js';
import Path from './path.js';

class Loader extends Events {

	constructor () {
		super();
		this.data = {};
		this.ran = false;
		this.methods = {};
		this.transformers = {};
	}

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

	}

	async execute (data) {
		let text = '\'use strict\';\n\n' + (data.ast ? data.ast.cooked : data.text);
		let code = new Function('$LOADER', 'window', text);
		data.result = code(this, window);
	}

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

	}

	async fetch (data) {
		let result = await window.fetch(data.url);

		if (result.status >= 200 && result.status < 300 || result.status == 304) {
			data.text = await result.text();
		} else {
			throw new Error(result.statusText);
		}

	}

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
	}

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

			return await this.execute(data);
		}

		if (data.method === 'script') {
			return await this.attach({
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
	}

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
	}

	async load (data) {

		if (typeof data === 'string') {
			data = { url: data };
		}

		data.url = Path.resolve(data.url);

		if (data.url in this.data) {
			await this.data[data.url].promise();
			return this.data[data.url].result;
		}

		this.data[data.url] = data;

		data.extension = data.extension || Path.extension(data.url);
		data.method = data.method || this.methods[data.extension];
		data.transformer = data.transformer || this.transformers[data.extension];

		if (data.extension === 'js') {
			data.promise = this.js.bind(this, data);
		} else if (data.extension === 'css') {
			data.promise = this.css.bind(this, data);
		} else {
			data.promise = this.fetch.bind(this, data);
		}

		await data.promise();

		return data.result;
	}

}

export default new Loader();

/*
	https://www.nczonline.net/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
*/
