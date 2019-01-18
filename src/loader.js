import Transformer from './transformer.js';
import Path from './path.js';

// import export in strings cause error
// backtick in template strings or regex could possibly causes issues

export default {

	data: {},
	type: '',

	async setup (options) {
		options = options || options;
		this.type = options.type || this.type;
	},

	async load (url, type) {
		type = type || this.type;

		url = Path.normalize(url);

		if (url in this.data) {
			return this.data[url];
		}

		if (!url) {
			throw new Error('import url argument required');
		}

		const data = await window.fetch(url);

		if (data.status == 404) {
			throw new Error('import not found ' + url);
		}

		if (data.status < 200 || data.status > 300 && data.status != 304) {
			throw new Error(data.statusText);
		}

		let code;

		code = await data.text();

		if (type === 'es' || type === 'est') {
			code = Transformer.template(code);
		}

		if (type === 'es' || type === 'esm') {
			code = Transformer.module(code, url);
		}

		code = new Function('window', '$LOADER', code);

		return this.data[url] = code(window, this);
	}

};
