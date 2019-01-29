
let BASE;

export default {

	get base () {
		if (!BASE) BASE = window.document.querySelector('base');
		if (BASE) return BASE.href;
		return window.location.origin + (window.location.pathname ? window.location.pathname : '/');
	},

	async setup (option) {
		option = option || {};

		if (option.base) {
			BASE = window.document.querySelector('base');

			if (!BASE) {
				BASE = window.document.createElement('base');
				window.document.head.insertBefore(BASE, window.document.head.firstElementChild);
			}

			BASE.href = option.base;
		}

	},

	extension (data) {
		const position = data.lastIndexOf('.');
		return position > 0 ? data.slice(position + 1) : '';
	},

	clean (data) {
		const origin = window.location.origin;
		const hash = window.location.hash.length;
		const search = window.location.search.length;
		const protocol = window.location.protocol + '//';

		if (data.slice(0, origin.length) === origin) {
			data = data.slice(origin.length);
		}

		if (data.slice(0, protocol.length) === protocol) {
			data = data.slice(protocol.length);
		}

		if (data.slice(-hash) === hash) {
			data = data.slice(0, -hash.length);
		}

		if (data.slice(-search.length) === search) {
			data = data.slice(0, -search.length);
		}

		return data || '/';
	},

	normalize (data) {
		const parser = window.document.createElement('a');

		data = this.clean(data);
		data = data.replace(/\/+/g, '/');

		parser.href = data;

		return parser.pathname ? parser.pathname : '/';
	},

	// normalize (data) {
	//
	// 	if (!data) {
	// 		throw new Error('Oxe.path.normalize - argument required');
	// 	}
	//
	// 	let flag = false;
	// 	const result = [];
	// 	const parts = this.clean(data).split(/\/+/);
	//
	// 	for (let i = 0, l = parts.length; i < l; i++) {
	// 		if (parts[i] === '.') {
	// 			continue;
	// 		} else if (parts[i] === '') {
	// 			if (i === 0) {
	// 				flag = true;
	// 			}
	// 		} else if (parts[i] === '..') {
	// 			if (i > 0) {
	// 				result.pop();
	// 			}
	// 		} else {
	// 			result.push(parts[i]);
	// 		}
	// 	}
	//
	// 	return (flag ? '/' : '') + result.join('/');
	// },

	join () {

		if (!arguments.length) {
			throw new Error('Oxe.path.join - argument required');
		}

		const result = [];

		for (let i = 0, l = arguments.length; i < l; i++) {
			result.push(arguments[i]);
		}

		return this.normalize(result.join('/'));
	},

	// resolve () {
	//
	// 	if (!arguments.length) {
	// 		throw new Error('Oxe.path.resolve - argument required');
	// 	}
	//
	// 	const result = [];
	//
	// 	let argument;
	// 	let i = arguments.length;
	//
	// 	while (argument = arguments[--i]) {
	//
	// 		result.unshift(this.clean(argument));
	//
	// 		if (argument[0] === '/') {
	// 			break;
	// 		}
	//
	// 	}
	//
	// 	if (result[0][0] !== '/') {
	// 		const base = this.base || window.location.pathname ? window.location.pathname : '/';
	// 		result.unshift(this.base);
	// 	}
	//
	// 	return this.normalize(result.join('/'));
	// }

}
